import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { writeAdminAuditEvent } from '@/lib/aws/audit'
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

  // Audit write is awaited and must succeed before any Cognito action.
  // NHI is not sent by the unlock modal, so patientNhiMasked is omitted.
  const audit = await writeAdminAuditEvent({
    action:      'ADMIN_ACCOUNT_UNLOCK_ATTEMPT',
    adminSub:    user.sub,
    adminEmail:  user.email,
    patientMsid: msid,
  })

  if (!audit.ok) {
    return NextResponse.json(
      { error: 'Audit write failed — action not taken' },
      { status: 500 }
    )
  }

  const result = await unlockPatientPortalAccount(username)

  if (result.status === 'error') {
    return NextResponse.json({ error: result.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
