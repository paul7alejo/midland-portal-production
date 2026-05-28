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
const ACTIVE_STATUSES = new Set<ReorderStatus>(['pending_review', 'reviewing', 'needs_followup'])

const PATIENT_STATUS_MESSAGES: Record<ReorderStatus, string> = {
  pending_review: 'Awaiting review by Midland Sleep staff.',
  reviewing:      'Your request is being reviewed by our team.',
  approved:       'Your request has been approved. We will be in touch.',
  sent:           'Your supplies have been dispatched.',
  cancelled:      'This request has been cancelled. Please contact Midland Sleep if you have questions.',
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
  return {
    id:               record.id,
    requestReference: record.request_reference ?? 'Request pending',
    status:           record.status,
    statusMessage:    PATIENT_STATUS_MESSAGES[record.status] ?? 'Your request is being reviewed by Midland Sleep staff.',
    createdAt:        record.created_at,
    updatedAt:        record.updated_at,
    items:            record.items,
    itemDescription:  record.item_description,
    source:           record.source,
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
  try {
    const user = await getVerifiedUser(request)
    const { sub, msid, orgId } = user

    safeLog('patient/reorder: lookup patient', { orgId })

    const patient = await getPatientByMSID(msid, orgId)
    if (!patient) {
      return NextResponse.json({ error: 'Patient record not found' }, { status: 404 })
    }

    if (
      typeof patient.patient_id !== 'string' || patient.patient_id.trim().length === 0 ||
      typeof patient.portal_id !== 'string' || patient.portal_id.trim().length === 0
    ) {
      return NextResponse.json({ error: 'Unable to submit request. Please try again.' }, { status: 500 })
    }

    // Block if an active (non-terminal) request already exists
    const existing = await getLatestReorderRequest(patient.patient_id, orgId)
    if (existing && ACTIVE_STATUSES.has(existing.status)) {
      safeLog('patient/reorder: active request exists, blocking new submission', { orgId })
      return NextResponse.json({
        existing: true,
        request: toPatientReorderResponse(existing),
      })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const b = body as Record<string, unknown>
    const requestType = b.type

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

      // Audit-first
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
        details:      `Support request ${requestReference} created; status pending_review.`,
        category:     'Orders',
        source:       'support_request',
        status:       'pending_review',
      })

      const reorder = await createReorderRequest({
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

      safeLog('patient/reorder: support request created', { orderId: reorder.id, orgId })

      return NextResponse.json({
        existing: false,
        orderId:  reorder.id,
        request:  toPatientReorderResponse(reorder),
      })
    }

    // ── Supply request path ──────────────────────────────────────────────────
    const { items, deliveryAddress } = b as { items?: unknown; deliveryAddress?: unknown }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item must be selected' }, { status: 400 })
    }

    const validatedItems = items.filter(
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
      details:      `Request ${requestReference} created for ${validatedItems.length} item(s); status pending_review.`,
      category:     'Orders',
      source:       'patient_portal_reorder',
      item_names:   validatedItems,
      status:       'pending_review',
    })

    const reorder = await createReorderRequest({
      id:                requestId,
      request_reference: requestReference,
      patient_id:        patient.patient_id,
      patient_msid:      patient.portal_id,
      patient_name:      patient.name ?? 'Patient name unavailable',
      org_id:            orgId,
      source:            'patient_portal_reorder',
      items:             validatedItems,
      delivery_address,
      created_by:        sub,
      ...estimates,
    })

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
    console.error('patient/reorder POST ERROR:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Unable to submit request. Please try again.' }, { status: 500 })
  }
}
