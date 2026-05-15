import { NextRequest, NextResponse } from 'next/server'
import { getVerifiedUser, safeLog, HttpError } from '@/lib/security'
import {
  getPatientByMSID,
  createReorderRequest,
  getPendingReorderRequest,
  appendAuditLog,
  type ReorderRecord,
  type ReorderDeliveryAddress,
} from '@/lib/aws/dynamodb'

const VALID_ITEM_TYPES = new Set(['cushion', 'headgear', 'mask_kit', 'filter'])

function toPatientReorderResponse(record: ReorderRecord) {
  return {
    id: record.id,
    requestReference: record.request_reference ?? 'Request pending',
    status: record.status,
    createdAt: record.created_at,
    items: record.items,
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

    const existing = await getPendingReorderRequest(patient.patient_id, orgId)
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
    // Identity comes entirely from server-side JWT verification + DB lookup.
    // The client never supplies patient_id, patient_msid, or org_id.
    const user = await getVerifiedUser(request)
    const { sub, msid, orgId } = user

    safeLog('patient/reorder: lookup patient', { orgId })

    const patient = await getPatientByMSID(msid, orgId)
    if (!patient) {
      return NextResponse.json({ error: 'Patient record not found' }, { status: 404 })
    }

    // Parse and validate body — client sends only items and delivery address
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { items, deliveryAddress } = body as { items?: unknown; deliveryAddress?: unknown }

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

    if (
      typeof patient.patient_id !== 'string' || patient.patient_id.trim().length === 0 ||
      typeof patient.portal_id !== 'string' || patient.portal_id.trim().length === 0
    ) {
      console.error('patient/reorder: patient identifiers missing', {
        hasPatientId: typeof patient.patient_id === 'string' && patient.patient_id.trim().length > 0,
        hasPortalId: typeof patient.portal_id === 'string' && patient.portal_id.trim().length > 0,
        orgId,
      })
      return NextResponse.json({ error: 'Unable to submit request. Please try again.' }, { status: 500 })
    }

    const existing = await getPendingReorderRequest(patient.patient_id, orgId)
    if (existing) {
      safeLog('patient/reorder: existing pending request returned', { orgId })
      return NextResponse.json({
        existing: true,
        request: toPatientReorderResponse(existing),
      })
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

    safeLog('patient/reorder: create request', {
      itemCount: validatedItems.length,
      hasPatientId: true,
      hasPortalId: true,
      orgId,
    })

    const reorder = await createReorderRequest({
      patient_id:   patient.patient_id,
      patient_msid: patient.portal_id,
      patient_name: patient.name,
      org_id:       orgId,
      items:        validatedItems,
      delivery_address,
      created_by: sub,
    })

    // Audit log: written after successful persist, no patient data in metadata
    await appendAuditLog({
      userId:     sub,
      event_type: 'REORDER_REQUEST',
      patient_id: patient.patient_id,
      order_id:   reorder.id,
      org_id:     orgId,
    }).catch((err) => {
      // Non-fatal: the order is already persisted; log audit failure server-side only
      console.error('patient/reorder: audit log failed', err instanceof Error ? err.message : String(err))
    })

    safeLog('patient/reorder: created', { orderId: reorder.id, orgId })

    return NextResponse.json({
      existing: false,
      orderId: reorder.id,
      request: toPatientReorderResponse(reorder),
    })
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('patient/reorder ERROR:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Unable to submit request. Please try again.' }, { status: 500 })
  }
}
