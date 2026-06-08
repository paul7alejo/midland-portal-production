import { NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { listReorderRequests, type ReorderRecord } from '@/lib/aws/dynamodb'

const ORG_ID = 'midland-sleep'
const RECENT_LIMIT = 20

const ITEM_LABELS: Record<string, string> = {
  cushion:  'Mask cushion',
  headgear: 'Headgear',
  mask_kit: 'Complete mask kit',
  filter:   'Filters',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isThisCalendarYear(iso: string): boolean {
  const d = new Date(iso)
  return !isNaN(d.getTime()) && d.getFullYear() === new Date().getFullYear()
}

function toDeliveredOrderSummary(r: ReorderRecord) {
  const itemNames = r.items.map((t) => ITEM_LABELS[t] ?? t)
  return {
    id:                    r.id,
    referenceNumber:       r.request_reference ?? '—',
    patient:               r.patient_name ?? 'Patient name unavailable',
    msid:                  r.patient_msid,
    items:                 itemNames.length > 0 ? itemNames.join(', ') : (r.item_description ?? '—'),
    status:                'Delivered' as const,
    createdDate:           formatDate(r.created_at),
    updatedDate:           r.updated_at ? formatDate(r.updated_at) : undefined,
    estimatedFundedAmount: r.estimated_funded_amount ?? null,
    needsFundingReview:    r.needs_funding_review ?? false,
  }
}

export type DeliveredOrderSummary = ReturnType<typeof toDeliveredOrderSummary>

export interface EntitlementSummaryResponse {
  deliveredOrdersThisYear:       number
  nominalFundingUsedEstimate:    number
  requestsNeedingFundingReview:  number
  recentDeliveredOrders:         DeliveredOrderSummary[]
}

export async function GET() {
  const admin = await getAdminUser()
  if (!admin || !isAuthorizedAdmin(admin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const records = await listReorderRequests(ORG_ID)

    const delivered = records.filter((r) => r.status === 'delivered')

    // "This year" uses updated_at (when delivered) where available, else created_at
    const deliveredThisYear = delivered.filter((r) =>
      isThisCalendarYear(r.updated_at ?? r.created_at)
    )

    const nominalFundingUsed = deliveredThisYear.reduce(
      (sum, r) => sum + (r.estimated_funded_amount ?? 0),
      0
    )

    const needsFundingReview = records.filter((r) => r.needs_funding_review).length

    // Most recently completed first
    const recentDelivered = [...delivered]
      .sort((a, b) =>
        (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at)
      )
      .slice(0, RECENT_LIMIT)
      .map(toDeliveredOrderSummary)

    const payload: EntitlementSummaryResponse = {
      deliveredOrdersThisYear:      deliveredThisYear.length,
      nominalFundingUsedEstimate:   nominalFundingUsed,
      requestsNeedingFundingReview: needsFundingReview,
      recentDeliveredOrders:        recentDelivered,
    }

    return NextResponse.json(payload)
  } catch (err) {
    console.error(
      'admin/entitlement GET ERROR:',
      err instanceof Error ? err.message : String(err)
    )
    return NextResponse.json({ error: 'Unable to load entitlement summary' }, { status: 500 })
  }
}
