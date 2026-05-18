import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { appendAuditLog } from '@/lib/aws/dynamodb'
import { unlockPatientPortalAccount } from '@/lib/aws/cognito-admin'

const MSID_RE = /^MS-\d+$/

export async function POST(request: NextRequest) {
  const user = await getAdminUser()
  if (!user || !isAuthorizedAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { msid } = body as Record<string, unknown>

  if (typeof msid !== 'string' || !MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Valid MSID is required' }, { status: 400 })
  }

  // Cognito username is the number-only portion of the MSID
  const username = msid.slice(3)  // strip "MS-"

  // Audit attempt must be written before any Cognito action
  await appendAuditLog({
    userId:       user.sub,
    event_type:   'ADMIN_ACCOUNT_UNLOCK_ATTEMPT',
    admin_id:     user.sub,
    admin_email:  user.email,
    patient_msid: msid,
    timestamp:    new Date().toISOString(),
    result:       'attempted',
  })

  const result = await unlockPatientPortalAccount(username)

  if (result.status === 'error') {
    return NextResponse.json({ error: result.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
