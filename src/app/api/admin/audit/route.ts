import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { listRecentAuditEvents } from '@/lib/aws/dynamodb'

const ORG_ID = 'midland-sleep'

const ACTION_LABELS: Record<string, string> = {
  ADMIN_PASSWORD_RESET_ATTEMPT:    'Password reset requested',
  ADMIN_ACCOUNT_UNLOCK_ATTEMPT:    'Account unlock requested',
  PATIENT_LOGIN:                   'Patient login',
  PATIENT_PASSWORD_CHANGED:        'Patient password changed',
  ACCOUNT_ENABLED:                 'Account enabled',
  NOTE_CREATED:                    'Note created',
  NOTE_DELETE_ATTEMPT:             'Note deletion requested',
  NOTE_SOFT_DELETED:               'Note deleted',
  NOTE_UPDATED:                    'Note edited',
  PATIENT_REVIEW_STATUS_UPDATED:   'Review status updated',
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

  const limitParam = parseInt(request.nextUrl.searchParams.get('limit') ?? '100', 10)
  const limit = isNaN(limitParam) ? 100 : Math.min(Math.max(1, limitParam), 200)

  try {
    const events = await listRecentAuditEvents(ORG_ID, limit)
    const items = events.map((e) => ({
      sk:          e.sk,
      timestamp:   e.timestamp,
      label:       labelForAction(e.action),
      action:      e.action,
      adminEmail:  e.adminEmail,
      patientMsid: e.patientMsid,
      result:      e.result,
      ...(e.details !== undefined && { details: e.details }),
    }))
    return NextResponse.json({ events: items })
  } catch {
    return NextResponse.json({ error: 'Failed to load audit log' }, { status: 500 })
  }
}
