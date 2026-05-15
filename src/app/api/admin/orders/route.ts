import { NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { listReorderRequests, type ReorderRecord } from '@/lib/aws/dynamodb'

const ORG_ID = 'midland-sleep'

const ITEM_LABELS: Record<string, string> = {
  cushion:  'Mask cushion',
  headgear: 'Headgear',
  mask_kit: 'Complete mask kit',
  filter:   'Filters',
}

function formatDateForDisplay(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

function toAdminOrder(r: ReorderRecord) {
  return {
    id:         r.id,
    requestId:  r.request_reference ?? 'Legacy request',
    patient:    r.patient_name ?? 'Patient name unavailable',
    msid:       r.patient_msid,
    date:       formatDateForDisplay(r.created_at),
    items:      r.items.map((t) => ITEM_LABELS[t] ?? t).join(', '),
    type:       'ENTITLEMENT' as const,
    status:     'Pending' as const,
    source:     r.source,
    created_at: r.created_at,
    delivery_address: r.delivery_address,
  }
}

export async function GET() {
  const admin = await getAdminUser()
  if (!admin || !isAuthorizedAdmin(admin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const records = await listReorderRequests(ORG_ID)
    // Sort newest first
    records.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return NextResponse.json({ orders: records.map(toAdminOrder) })
  } catch (err) {
    console.error('admin/orders GET ERROR:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Unable to load orders' }, { status: 500 })
  }
}
