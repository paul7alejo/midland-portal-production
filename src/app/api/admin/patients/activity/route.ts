import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { queryAuditByPatient } from '@/lib/aws/dynamodb'

const MSID_RE = /^MS-\d+$/

const ACTION_LABELS: Record<string, string> = {
  ADMIN_PASSWORD_RESET_ATTEMPT:    'Password reset requested',
  ADMIN_ACCOUNT_UNLOCK_ATTEMPT:    'Account unlock requested',
  PATIENT_LOGIN:                   'Patient login',
  PATIENT_PASSWORD_CHANGED:        'Patient password changed',
  ACCOUNT_ENABLED:                 'Account enabled',
  NOTE_DELETE_ATTEMPT:             'Note deletion requested',
  NOTE_SOFT_DELETED:               'Note deleted',
  NOTE_UPDATED:                    'Note edited',
  PATIENT_REVIEW_STATUS_UPDATED:   'Patient review status updated',
  PATIENT_OUTREACH_STATUS_UPDATED: 'Outreach status updated',
  PATIENT_SAFETY_STATUS_UPDATED:   'Admin caution status updated',
  PATIENT_SAFETY_DETAILS_UPDATED:  'Admin caution details updated',
}

function labelForAction(action: string): string {
  if (!action) return 'Unknown event'
  return (
    ACTION_LABELS[action] ??
    action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user || !isAuthorizedAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const msid = request.nextUrl.searchParams.get('msid') ?? ''
  if (!MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Valid MSID is required' }, { status: 400 })
  }

  try {
    // queryAuditByPatient defaults to limit=20 — no client-side slicing needed
    const events = await queryAuditByPatient(msid)
    const activity = events.map((e) => ({
      timestamp:  e.timestamp,
      label:      labelForAction(e.action),
      action:     e.action,
      adminEmail: e.adminEmail,
      result:     e.result,
    }))
    return NextResponse.json({ activity })
  } catch {
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 })
  }
}
