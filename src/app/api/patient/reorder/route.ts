import { NextRequest, NextResponse } from 'next/server'
import { getVerifiedUser, safeLog, HttpError } from '@/lib/security'
import {
  getPatientByMSID,
  createReorderRequest,
  appendAuditLog,
  type ReorderDeliveryAddress,
} from '@/lib/aws/dynamodb'

const VALID_ITEM_TYPES = new Set(['cushion', 'headgear', 'mask_kit', 'filter'])

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

export async function POST(request: NextRequest) {
  try {
    // Identity comes entirely from server-side JWT verification + DB lookup.
    // The client never supplies patient_id, patient_msid, or org_id.
    const user = await getVerifiedUser(request)
    const { sub, msid, orgId } = user

    safeLog('patient/reorder: lookup patient', { msid, orgId })

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

    const orderId = await createReorderRequest({
      patient_id:   patient.patient_id,
      patient_msid: patient.portal_id,
      org_id:       orgId,
      items:        validatedItems,
      delivery_address: {
        line1:    deliveryAddress.line1.trim(),
        line2:    deliveryAddress.line2?.trim() || undefined,
        city:     deliveryAddress.city.trim(),
        region:   deliveryAddress.region?.trim() || undefined,
        postcode: deliveryAddress.postcode.trim(),
        country:  deliveryAddress.country.trim(),
      },
      created_by: sub,
    })

    // Audit log: written after successful persist, no patient data in metadata
    await appendAuditLog({
      userId:     sub,
      event_type: 'REORDER_REQUEST',
      patient_id: patient.patient_id,
      order_id:   orderId,
      org_id:     orgId,
    }).catch((err) => {
      // Non-fatal: the order is already persisted; log audit failure server-side only
      console.error('patient/reorder: audit log failed', err instanceof Error ? err.message : String(err))
    })

    safeLog('patient/reorder: created', { orderId, msid, orgId })

    return NextResponse.json({ orderId })
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('patient/reorder ERROR:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Unable to submit request. Please try again.' }, { status: 500 })
  }
}
