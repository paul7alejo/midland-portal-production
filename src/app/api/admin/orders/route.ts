import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import {
  listReorderRequests,
  listReorderRequestsByMsid,
  updateReorderStatus,
  updateNeedsFundingReview,
  appendAuditLog,
  type ReorderRecord,
  type ReorderStatus,
} from '@/lib/aws/dynamodb'

const ORG_ID = 'midland-sleep'

const VALID_STATUSES = new Set<ReorderStatus>([
  'pending_review', 'reviewing', 'approved', 'sent', 'cancelled', 'declined', 'needs_followup',
])

const STATUS_DISPLAY: Record<ReorderStatus, string> = {
  pending_review: 'New',
  reviewing:      'Reviewing',
  approved:       'Approved',
  sent:           'Sent',
  cancelled:      'Cancelled',
  declined:       'Declined',
  needs_followup: 'Needs Follow-Up',
}

const ITEM_LABELS: Record<string, string> = {
  cushion:  'Mask cushion',
  headgear: 'Headgear',
  mask_kit: 'Complete mask kit',
  filter:   'Filters',
}

const ITEM_CATEGORY: Record<string, string> = {
  cushion:  'Mask',
  headgear: 'Headgear',
  mask_kit: 'Mask',
  filter:   'Filters',
}

function formatDateForDisplay(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

function toAdminOrder(r: ReorderRecord) {
  return {
    id:        r.id,
    requestId: r.request_reference ?? 'Legacy request',
    patient:   r.patient_name ?? 'Patient name unavailable',
    msid:      r.patient_msid,
    date:      formatDateForDisplay(r.created_at),
    items:     r.items.length > 0
      ? r.items.map((t) => ITEM_LABELS[t] ?? t).join(', ')
      : (r.item_description ?? '—'),
    category:  r.items.map((t) => ITEM_CATEGORY[t] ?? 'Support request')[0] ?? 'Support request',
    type:      'ENTITLEMENT' as const,
    status:    STATUS_DISPLAY[r.status] ?? 'New',
    source:    r.source,
    created_at: r.created_at,
    updated_at: r.updated_at,
    updatedDate:             r.updated_at ? formatDateForDisplay(r.updated_at) : undefined,
    delivery_address:        r.delivery_address,
    needsFundingReview:      r.needs_funding_review ?? false,
    reviewReason:            r.review_reason,
    itemDescription:         r.item_description,
    estimatedItemAmount:     r.estimated_amount,
    estimatedFundedAmount:     r.estimated_funded_amount,
    estimatedPatientCopay:     r.estimated_patient_copay,
    estimatedRemainingAfter:   r.estimated_remaining_after,
  }
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser()
  if (!admin || !isAuthorizedAdmin(admin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const msid = request.nextUrl.searchParams.get('msid')
    const records = msid
      ? await listReorderRequestsByMsid(msid, ORG_ID)
      : await listReorderRequests(ORG_ID)
    records.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return NextResponse.json({ orders: records.map(toAdminOrder) })
  } catch (err) {
    console.error('admin/orders GET ERROR:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Unable to load orders' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminUser()
  if (!admin || !isAuthorizedAdmin(admin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const id = b.id

  if (typeof id !== 'string' || id.trim().length === 0) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // Route: needsFundingReview toggle
  if ('needsFundingReview' in b) {
    const flag = b.needsFundingReview
    if (typeof flag !== 'boolean') {
      return NextResponse.json({ error: 'needsFundingReview must be boolean' }, { status: 400 })
    }
    const reviewReason = typeof b.reviewReason === 'string' ? b.reviewReason : undefined

    try {
      await appendAuditLog({
        userId:      admin.sub,
        event_type:  'REQUEST_STATUS_UPDATED',
        action:      'REQUEST_STATUS_UPDATED',
        order_id:    id,
        org_id:      ORG_ID,
        timestamp:   new Date().toISOString(),
        result:      'success',
        details:     `Needs funding review set to ${flag}${reviewReason ? ` — ${reviewReason}` : ''}.`,
        admin_email: admin.email,
        category:    'Orders',
      })
    } catch (err) {
      console.error('admin/orders PATCH funding-review: audit failed', err instanceof Error ? err.message : String(err))
      return NextResponse.json({ error: 'Unable to update funding review flag' }, { status: 500 })
    }

    try {
      await updateNeedsFundingReview({
        id,
        needs_funding_review: flag,
        review_reason:        reviewReason,
        orgId:                ORG_ID,
        adminSub:             admin.sub,
        adminEmail:           admin.email,
      })
    } catch (err) {
      console.error('admin/orders PATCH funding-review: update failed', err instanceof Error ? err.message : String(err))
      return NextResponse.json({ error: 'Unable to update funding review flag' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  // Route: status update
  const status = b.status
  if (typeof status !== 'string' || !VALID_STATUSES.has(status as ReorderStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${[...VALID_STATUSES].join(', ')}` },
      { status: 400 }
    )
  }

  // Audit-first: write before mutation; abort if audit fails
  try {
    await appendAuditLog({
      userId:      admin.sub,
      event_type:  'REQUEST_STATUS_UPDATED',
      action:      'REQUEST_STATUS_UPDATED',
      order_id:    id,
      org_id:      ORG_ID,
      timestamp:   new Date().toISOString(),
      result:      'success',
      details:     `Request status updated to ${status}.`,
      admin_email: admin.email,
      new_status:  status,
      category:    'Orders',
    })
  } catch (err) {
    console.error('admin/orders PATCH: audit failed', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Unable to update request status' }, { status: 500 })
  }

  try {
    await updateReorderStatus({
      id,
      status:    status as ReorderStatus,
      orgId:     ORG_ID,
      adminSub:  admin.sub,
      adminEmail: admin.email,
    })
  } catch (err) {
    console.error('admin/orders PATCH: update failed', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Unable to update request status' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
