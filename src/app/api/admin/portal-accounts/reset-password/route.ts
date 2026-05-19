import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { writeAdminAuditEvent } from '@/lib/aws/audit'
import { resetPatientPortalPassword } from '@/lib/aws/cognito-admin'

// "MS-" + one or more digits
const MSID_RE = /^MS-\d+$/
// 3 uppercase letters + 4 asterisks (NZ NHI mask format)
const NHI_MASKED_RE = /^[A-Z]{3}\*{4}$/

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

  const { msid, nhiMasked: nhiMaskedRaw } = body as Record<string, unknown>

  if (typeof msid !== 'string' || !MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Valid MSID is required' }, { status: 400 })
  }
  // Accept a valid NHI mask or '—' sentinel for imported accounts without on-file NHI
  const nhiMasked =
    typeof nhiMaskedRaw === 'string' && NHI_MASKED_RE.test(nhiMaskedRaw)
      ? nhiMaskedRaw
      : '—'

  // Cognito username is the number-only portion of the MSID
  const username = msid.slice(3)  // strip "MS-"

  // Audit write is awaited and must succeed before any Cognito action.
  const audit = await writeAdminAuditEvent({
    action:           'ADMIN_PASSWORD_RESET_ATTEMPT',
    adminSub:         user.sub,
    adminEmail:       user.email,
    patientMsid:      msid,
    patientNhiMasked: nhiMasked,
  })

  if (!audit.ok) {
    return NextResponse.json(
      { error: 'Audit write failed — action not taken' },
      { status: 500 }
    )
  }

  const result = await resetPatientPortalPassword(username)

  if (result.status === 'error') {
    return NextResponse.json({ error: result.message }, { status: 500 })
  }

  // Temporary password is returned to the client exactly once and never stored or logged.
  return NextResponse.json({ temporaryPassword: result.temporaryPassword })
}
