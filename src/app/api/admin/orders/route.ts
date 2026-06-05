import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import {
  listReorderRequests,
  listReorderRequestsByMsid,
  updateReorderStatus,
  updateNeedsFundingReview,
  appendAuditLog,
  getReorderById,
  type ReorderRecord,
  type ReorderStatus,
} from '@/lib/aws/dynamodb'
import { listPortalUsers } from '@/lib/aws/cognito-admin'
import {
  queuePatientNotification,
  type NotificationTriggerStatus,
} from '@/lib/aws/notifications'

const ORG_ID = 'midland-sleep'

const VALID_STATUSES = new Set<ReorderStatus>([
  'new', 'reviewing', 'approved', 'sent', 'delivered', 'declined', 'needs_followup',
])

const NOTIFICATION_STATUSES = new Set<ReorderStatus>(['approved', 'sent', 'declined', 'needs_followup'])

const STATUS_DISPLAY: Record<ReorderStatus, string> = {
  new:            'New',
  reviewing:      'Reviewing',
  approved:       'Approved',
  sent:           'Sent',
  delivered:      'Delivered',
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

type PortalAccountStatus = 'linked' | 'no_account' | 'unknown'

function toAdminOrder(r: ReorderRecord, portalMsids: Set<string> | null) {
  const referenceNumber = r.request_reference ?? 'Legacy request'
  const itemNames = r.items.map((t) => ITEM_LABELS[t] ?? t)
  const portalAccountStatus: PortalAccountStatus = portalMsids === null
    ? 'unknown'
    : portalMsids.has(r.patient_msid) ? 'linked' : 'no_account'
  return {
    id:        r.id,
    referenceNumber,
    requestId: referenceNumber,
    patient:   r.patient_name ?? 'Patient name unavailable',
    msid:      r.patient_msid,
    date:      formatDateForDisplay(r.created_at),
    itemNames,
    items:     itemNames.length > 0
      ? itemNames.join(', ')
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
    contactPreference:       r.contact_preference,
    estimatedCost:           r.estimated_amount,
    estimatedFunded:         r.estimated_funded_amount,
    estimatedCopay:          r.estimated_patient_copay,
    estimatedRemaining:      r.estimated_remaining_after,
    estimatedItemAmount:     r.estimated_amount,
    estimatedFundedAmount:   r.estimated_funded_amount,
    estimatedPatientCopay:   r.estimated_patient_copay,
    estimatedRemainingAfter: r.estimated_remaining_after,
    portalAccountStatus,
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

    // Build portal MSID set for safe linkage annotation.
    // Non-fatal: if Cognito is unavailable, orders still load with status "unknown".
    let portalMsids: Set<string> | null = null
    try {
      const users = await listPortalUsers()
      portalMsids = new Set(users.map((u) => u.msid))
    } catch (err) {
      console.warn(
        'admin/orders GET: portal user lookup failed; portalAccountStatus will be "unknown".',
        err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      )
    }

    return NextResponse.json({ orders: records.map((r) => toAdminOrder(r, portalMsids)) })
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

  // Fetch the existing record to capture patient context for audit.
  // Non-fatal if the lookup fails — audit proceeds without patient_msid.
  let existingRecord: Awaited<ReturnType<typeof getReorderById>> = null
  try {
    existingRecord = await getReorderById(id, ORG_ID)
  } catch (err) {
    console.warn('admin/orders PATCH: pre-audit record lookup failed', err instanceof Error ? err.message : String(err))
  }
  const patientMsid       = existingRecord?.patient_msid
  const requestReference  = existingRecord?.request_reference
  const previousStatus    = existingRecord?.status

  // Route: needsFundingReview toggle
  if ('needsFundingReview' in b) {
    const flag = b.needsFundingReview
    if (typeof flag !== 'boolean') {
      return NextResponse.json({ error: 'needsFundingReview must be boolean' }, { status: 400 })
    }
    const reviewReason = typeof b.reviewReason === 'string' ? b.reviewReason : undefined

    try {
      await appendAuditLog({
        userId:          admin.sub,
        event_type:      'REQUEST_STATUS_UPDATED',
        action:          'REQUEST_STATUS_UPDATED',
        order_id:        id,
        org_id:          ORG_ID,
        timestamp:       new Date().toISOString(),
        result:          'success',
        details:         `Needs funding review set to ${flag}${reviewReason ? ` — ${reviewReason}` : ''}.`,
        admin_email:     admin.email,
        category:        'Orders',
        patient_msid:    patientMsid,
        request_id:      requestReference,
        previous_status: previousStatus,
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
      userId:          admin.sub,
      event_type:      'REQUEST_STATUS_UPDATED',
      action:          'REQUEST_STATUS_UPDATED',
      order_id:        id,
      org_id:          ORG_ID,
      timestamp:       new Date().toISOString(),
      result:          'success',
      details:         `Request status updated to ${status}.`,
      admin_email:     admin.email,
      new_status:      status,
      category:        'Orders',
      patient_msid:    patientMsid,
      request_id:      requestReference,
      previous_status: previousStatus,
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

  // Queue patient notification for actionable statuses — non-blocking, never fails the request
  let notificationQueue: {
    ok: boolean
    scheduledFor?: string
    reason?: string
    step?: string
    hasNotificationsTableName?: boolean
    errorName?: string
    awsHttpStatus?: number
    awsRequestId?: string
  } | undefined
  if (NOTIFICATION_STATUSES.has(status as ReorderStatus)) {
    if (patientMsid) {
      const queueResult = await queuePatientNotification({
        patientMsid,
        requestId:     requestReference ?? id,
        triggerStatus: status as NotificationTriggerStatus,
        orgId:         ORG_ID,
      })
      notificationQueue = queueResult.ok
        ? { ok: true, scheduledFor: queueResult.scheduledFor }
        : {
            ok: false,
            reason: queueResult.reason,
            step: queueResult.step,
            hasNotificationsTableName: queueResult.hasNotificationsTableName,
            errorName: queueResult.errorName,
            awsHttpStatus: queueResult.awsHttpStatus,
            awsRequestId: queueResult.awsRequestId,
          }
    } else {
      notificationQueue = {
        ok: false,
        reason: 'queue_unavailable',
        step: 'patient_context',
        hasNotificationsTableName: Boolean(process.env.NOTIFICATIONS_TABLE_NAME),
        errorName: 'MissingPatientMsid',
      }
      console.warn('[notifications] skipping queue — patientMsid unavailable', {
        action: 'queue_patient_notification',
        step: 'patient_context',
        request_id: requestReference ?? id,
        patient_msid: null,
        trigger_status: status,
        hasNotificationsTableName: Boolean(process.env.NOTIFICATIONS_TABLE_NAME),
        errorName: 'MissingPatientMsid',
      })
    }
  }

  return NextResponse.json({
    ok: true,
    ...(notificationQueue !== undefined && { notificationQueue }),
  })
}
