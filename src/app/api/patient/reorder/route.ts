import { NextRequest, NextResponse } from 'next/server'
import { getVerifiedUser, safeLog, HttpError } from '@/lib/security'
import {
  getPatientByMSID,
  createReorderRequest,
  createRequestReference,
  getLatestReorderRequest,
  appendAuditLog,
  type ReorderRecord,
  type ReorderDeliveryAddress,
  type ReorderStatus,
} from '@/lib/aws/dynamodb'
import { randomUUID } from 'crypto'

const VALID_ITEM_TYPES = new Set(['cushion', 'headgear', 'mask_kit', 'filter'])

const ITEM_PRICES: Record<string, number> = {
  cushion:   45,
  headgear:  65,
  mask_kit: 120,
  filter:    25,
}

const ANNUAL_ALLOWANCE = 250

// Statuses where a new request should be blocked (non-terminal active states)
const ACTIVE_STATUSES = new Set<ReorderStatus>(['new', 'reviewing', 'needs_followup'])

const PATIENT_STATUS_MESSAGES: Record<ReorderStatus, string> = {
  new:            'Awaiting review by Midland Sleep staff.',
  reviewing:      'Your request is being reviewed by our team.',
  approved:       'Your request has been approved. We will be in touch.',
  sent:           'Your supplies have been dispatched.',
  declined:       'Your request was not approved at this time. Please contact Midland Sleep if you have questions.',
  needs_followup: 'Our team needs to follow up with you. We will be in touch shortly.',
}

function calcEstimates(items: string[]): {
  estimated_amount: number
  estimated_funded_amount: number
  estimated_patient_copay: number
  estimated_remaining_after: number
} {
  const total = items.reduce((sum, i) => sum + (ITEM_PRICES[i] ?? 0), 0)
  const funded = Math.min(total, ANNUAL_ALLOWANCE)
  return {
    estimated_amount:          total,
    estimated_funded_amount:   funded,
    estimated_patient_copay:   Math.max(0, total - funded),
    estimated_remaining_after: Math.max(0, ANNUAL_ALLOWANCE - funded),
  }
}

// Patient-safe response — no dollar amounts, no funding data
function toPatientReorderResponse(record: ReorderRecord) {
  const referenceNumber = record.request_reference ?? 'Request pending'
  return {
    id:                record.id,
    referenceNumber,
    requestReference:  referenceNumber,
    status:            record.status,
    statusMessage:     PATIENT_STATUS_MESSAGES[record.status] ?? 'Your request is being reviewed by Midland Sleep staff.',
    createdAt:         record.created_at,
    updatedAt:         record.updated_at,
    itemNames:         record.items,
    items:             record.items,
    itemDescription:   record.item_description,
    contactPreference: record.contact_preference,
    source:            record.source,
  }
}

function isValidAddress(a: unknown): a is ReorderDeliveryAddress {
  if (!a || typeof a !== 'object') return false
  const addr = a as Record<string, unknown>
  return (
    typeof addr.line1 === 'string' && addr.line1.trim().length > 0 &&
    typeof addr.city  === 'string' && addr.city.trim().length  > 0 &&
    typeof addr.postcode === 'string' && addr.postcode.trim().length > 0 &&
    typeof addr.country  === 'string' && addr.country.trim().length  > 0
  )
}

const SAFE_RESPONSE_STEPS = new Set([
  'patient_lookup', 'patient_validation', 'latest_request_lookup', 'audit_write', 'request_create',
])
function safeStep(s: string): string {
  return SAFE_RESPONSE_STEPS.has(s) ? s : 'unknown'
}

export async function GET(request: NextRequest) {
  try {
    const user = await getVerifiedUser(request)
    const { msid, orgId } = user

    const patient = await getPatientByMSID(msid, orgId)
    if (!patient) {
      return NextResponse.json({ error: 'Patient record not found' }, { status: 404 })
    }

    const existing = await getLatestReorderRequest(patient.patient_id, orgId)
    return NextResponse.json({
      request: existing ? toPatientReorderResponse(existing) : null,
    })
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('patient/reorder GET ERROR:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Unable to load reorder request' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let step = 'init'
  let msid = ''
  let orgId = ''
  let sub = ''
  let requestType: unknown = undefined
  try {
    step = 'auth'
    const user = await getVerifiedUser(request)
    ;({ sub, msid, orgId } = user)

    safeLog('patient/reorder: lookup patient', { orgId })

    step = 'patient_lookup'
    const patient = await getPatientByMSID(msid, orgId)
    if (!patient) {
      const normalizedMsid = msid.startsWith('MS-') ? msid : `MS-${msid}`
      console.warn('[patient/reorder] Patient record not found', { msid, normalizedMsid, cognitoSub: sub, orgId })
      return NextResponse.json({ error: 'Patient record not found' }, { status: 404 })
    }

    step = 'patient_validation'
    if (
      typeof patient.patient_id !== 'string' || patient.patient_id.trim().length === 0 ||
      typeof patient.portal_id !== 'string' || patient.portal_id.trim().length === 0
    ) {
      const normalizedMsid = msid.startsWith('MS-') ? msid : `MS-${msid}`
      console.warn('[patient/reorder] patient_id/portal_id missing on resolved record', {
        step,
        msid,
        normalizedMsid,
        cognitoSub: sub,
        orgId,
        hasPatientId: typeof patient.patient_id === 'string',
        hasPortalId: typeof patient.portal_id === 'string',
        hasPk: typeof patient.pk === 'string',
      })
      return NextResponse.json({ error: 'Unable to submit request. Please try again.', code: 'REORDER_SUBMISSION_FAILED', step: safeStep(step) }, { status: 500 })
    }

    // Block if an active (non-terminal) request already exists
    step = 'latest_request_lookup'
    const existing = await getLatestReorderRequest(patient.patient_id, orgId)
    if (existing && ACTIVE_STATUSES.has(existing.status)) {
      safeLog('patient/reorder: active request exists, blocking new submission', { orgId })
      return NextResponse.json({
        existing: true,
        request: toPatientReorderResponse(existing),
      })
    }

    step = 'body_parse'
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const b = body as Record<string, unknown>
    requestType = b.type

    // ── Support request path ─────────────────────────────────────────────────
    if (requestType === 'support_request') {
      const itemDescription = b.itemDescription
      if (typeof itemDescription !== 'string' || itemDescription.trim().length === 0) {
        return NextResponse.json({ error: 'Please describe what you need.' }, { status: 400 })
      }
      const reason = typeof b.reason === 'string' ? b.reason.trim() : undefined
      const contactPreference = typeof b.contactPreference === 'string' ? b.contactPreference : 'either'

      const requestId  = randomUUID()
      const createdAt  = new Date().toISOString()
      const requestReference = createRequestReference(createdAt)

      // Audit-first — must succeed before creating the order
      step = 'audit_write'
      try {
        await appendAuditLog({
          userId:       sub,
          event_type:   'PATIENT_SUPPORT_REQUEST_CREATED',
          action:       'PATIENT_SUPPORT_REQUEST_CREATED',
          patient_id:   patient.patient_id,
          patient_msid: patient.portal_id,
          order_id:     requestId,
          request_id:   requestReference,
          org_id:       orgId,
          timestamp:    createdAt,
          result:       'success',
          details:      `Support request ${requestReference} created; status new.`,
          category:     'Orders',
          source:       'support_request',
          status:       'new',
        })
      } catch (auditErr) {
        const awsMeta = (auditErr as { $metadata?: { requestId?: string; httpStatusCode?: number } }).$metadata
        console.error('[patient/reorder] audit_write failed (support_request)', {
          step,
          msid,
          normalizedMsid: msid.startsWith('MS-') ? msid : `MS-${msid}`,
          cognitoSub: sub,
          orgId,
          requestType: 'support_request',
          errorName: auditErr instanceof Error ? auditErr.name : 'UnknownError',
          errorMessage: (auditErr instanceof Error ? auditErr.message : String(auditErr)).slice(0, 200),
          awsRequestId: awsMeta?.requestId,
          awsHttpStatus: awsMeta?.httpStatusCode,
        })
        return NextResponse.json({ error: 'Unable to submit request. Please try again.', code: 'REORDER_SUBMISSION_FAILED', step: safeStep(step) }, { status: 500 })
      }

      step = 'request_create'
      let reorder: ReorderRecord
      try {
        reorder = await createReorderRequest({
          id:                requestId,
          request_reference: requestReference,
          patient_id:        patient.patient_id,
          patient_msid:      patient.portal_id,
          patient_name:      patient.name ?? 'Patient name unavailable',
          org_id:            orgId,
          source:            'support_request',
          item_description:  itemDescription.trim(),
          reason,
          contact_preference: contactPreference,
          created_by:        sub,
        })
      } catch (createErr) {
        const awsMeta = (createErr as { $metadata?: { requestId?: string; httpStatusCode?: number } }).$metadata
        console.error('[patient/reorder] request_create failed (support_request)', {
          step,
          msid,
          normalizedMsid: msid.startsWith('MS-') ? msid : `MS-${msid}`,
          cognitoSub: sub,
          orgId,
          requestType: 'support_request',
          errorName: createErr instanceof Error ? createErr.name : 'UnknownError',
          errorMessage: (createErr instanceof Error ? createErr.message : String(createErr)).slice(0, 200),
          awsRequestId: awsMeta?.requestId,
          awsHttpStatus: awsMeta?.httpStatusCode,
        })
        return NextResponse.json({ error: 'Unable to submit request. Please try again.', code: 'REORDER_SUBMISSION_FAILED', step: safeStep(step) }, { status: 500 })
      }

      safeLog('patient/reorder: support request created', { orderId: reorder.id, orgId })

      return NextResponse.json({
        existing: false,
        orderId:  reorder.id,
        request:  toPatientReorderResponse(reorder),
      })
    }

    if (requestType !== 'patient_portal') {
      return NextResponse.json({ error: 'Unknown request type' }, { status: 400 })
    }

    // ── Supply request path ──────────────────────────────────────────────────
    const { itemNames, deliveryAddress } = b as { itemNames?: unknown; deliveryAddress?: unknown }

    if (!Array.isArray(itemNames) || itemNames.length === 0) {
      return NextResponse.json({ error: 'At least one item must be selected' }, { status: 400 })
    }

    const validatedItems = itemNames.filter(
      (i): i is string => typeof i === 'string' && VALID_ITEM_TYPES.has(i)
    )
    if (validatedItems.length === 0) {
      return NextResponse.json({ error: 'No valid item types provided' }, { status: 400 })
    }

    if (!isValidAddress(deliveryAddress)) {
      return NextResponse.json(
        { error: 'A complete delivery address is required (line1, city, postcode, country)' },
        { status: 400 }
      )
    }

    const delivery_address: ReorderDeliveryAddress = {
      line1:    deliveryAddress.line1.trim(),
      city:     deliveryAddress.city.trim(),
      postcode: deliveryAddress.postcode.trim(),
      country:  deliveryAddress.country.trim(),
    }
    const line2 = deliveryAddress.line2?.trim()
    if (line2) delivery_address.line2 = line2
    const region = deliveryAddress.region?.trim()
    if (region) delivery_address.region = region

    safeLog('patient/reorder: create supply request', {
      itemCount: validatedItems.length,
      orgId,
    })

    const estimates   = calcEstimates(validatedItems)
    const requestId   = randomUUID()
    const createdAt   = new Date().toISOString()
    const requestReference = createRequestReference(createdAt)

    // Audit-first
    step = 'audit_write'
    try {
      await appendAuditLog({
        userId:       sub,
        event_type:   'PATIENT_REQUEST_CREATED',
        action:       'PATIENT_REQUEST_CREATED',
        patient_id:   patient.patient_id,
        patient_msid: patient.portal_id,
        order_id:     requestId,
        request_id:   requestReference,
        org_id:       orgId,
        timestamp:    createdAt,
        result:       'success',
        details:      `Request ${requestReference} created for ${validatedItems.length} item(s); status new.`,
        category:     'Orders',
        source:       'patient_portal',
        item_names:   validatedItems,
        status:       'new',
      })
    } catch (auditErr) {
      const awsMeta = (auditErr as { $metadata?: { requestId?: string; httpStatusCode?: number } }).$metadata
      console.error('[patient/reorder] audit_write failed (patient_portal)', {
        step,
        msid,
        normalizedMsid: msid.startsWith('MS-') ? msid : `MS-${msid}`,
        cognitoSub: sub,
        orgId,
        requestType: 'patient_portal',
        itemNamesCount: validatedItems.length,
        hasDeliveryAddress: true,
        errorName: auditErr instanceof Error ? auditErr.name : 'UnknownError',
        errorMessage: (auditErr instanceof Error ? auditErr.message : String(auditErr)).slice(0, 200),
        awsRequestId: awsMeta?.requestId,
        awsHttpStatus: awsMeta?.httpStatusCode,
      })
      return NextResponse.json({ error: 'Unable to submit request. Please try again.', code: 'REORDER_SUBMISSION_FAILED', step: safeStep(step) }, { status: 500 })
    }

    step = 'request_create'
    let reorder: ReorderRecord
    try {
      reorder = await createReorderRequest({
        id:                requestId,
        request_reference: requestReference,
        patient_id:        patient.patient_id,
        patient_msid:      patient.portal_id,
        patient_name:      patient.name ?? 'Patient name unavailable',
        org_id:            orgId,
        source:            'patient_portal',
        items:             validatedItems,
        delivery_address,
        created_by:        sub,
        ...estimates,
      })
    } catch (createErr) {
      const awsMeta = (createErr as { $metadata?: { requestId?: string; httpStatusCode?: number } }).$metadata
      console.error('[patient/reorder] request_create failed (patient_portal)', {
        step,
        msid,
        normalizedMsid: msid.startsWith('MS-') ? msid : `MS-${msid}`,
        cognitoSub: sub,
        orgId,
        requestType: 'patient_portal',
        itemNamesCount: validatedItems.length,
        hasDeliveryAddress: true,
        errorName: createErr instanceof Error ? createErr.name : 'UnknownError',
        errorMessage: (createErr instanceof Error ? createErr.message : String(createErr)).slice(0, 200),
        awsRequestId: awsMeta?.requestId,
        awsHttpStatus: awsMeta?.httpStatusCode,
      })
      return NextResponse.json({ error: 'Unable to submit request. Please try again.', code: 'REORDER_SUBMISSION_FAILED', step: safeStep(step) }, { status: 500 })
    }

    safeLog('patient/reorder: supply request created', { orderId: reorder.id, orgId })

    return NextResponse.json({
      existing: false,
      orderId:  reorder.id,
      request:  toPatientReorderResponse(reorder),
    })
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    const awsMeta = (err as { $metadata?: { requestId?: string; httpStatusCode?: number } }).$metadata
    console.error('[patient/reorder] POST failed', {
      step,
      msid: msid || '(unknown)',
      normalizedMsid: msid ? (msid.startsWith('MS-') ? msid : `MS-${msid}`) : '(unknown)',
      cognitoSub: sub || '(unknown)',
      orgId: orgId || '(unknown)',
      requestType: String(requestType ?? '(unknown)'),
      errorName: err instanceof Error ? err.name : 'UnknownError',
      errorMessage: (err instanceof Error ? err.message : String(err)).slice(0, 200),
      awsRequestId: awsMeta?.requestId,
      awsHttpStatus: awsMeta?.httpStatusCode,
    })
    return NextResponse.json({ error: 'Unable to submit request. Please try again.', code: 'REORDER_SUBMISSION_FAILED', step: safeStep(step) }, { status: 500 })
  }
}
