import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { appendAuditLog } from '@/lib/aws/dynamodb'
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

  const { msid, nhiMasked } = body as Record<string, unknown>

  if (typeof msid !== 'string' || !MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Valid MSID is required' }, { status: 400 })
  }
  if (typeof nhiMasked !== 'string' || !NHI_MASKED_RE.test(nhiMasked)) {
    return NextResponse.json({ error: 'Valid masked NHI is required' }, { status: 400 })
  }

  // Cognito username is the number-only portion of the MSID
  const username = msid.slice(3)  // strip "MS-"

  // Audit attempt must be written before any Cognito action
  await appendAuditLog({
    userId:              user.sub,
    event_type:          'ADMIN_PASSWORD_RESET_ATTEMPT',
    admin_id:            user.sub,
    admin_email:         user.email,
    patient_msid:        msid,
    patient_nhi_masked:  nhiMasked,
    timestamp:           new Date().toISOString(),
    result:              'attempted',
  })

  const result = await resetPatientPortalPassword(username)

  if (result.status === 'error') {
    return NextResponse.json({ error: result.message }, { status: 500 })
  }

  // Temporary password is returned to the client exactly once and never stored or logged.
  return NextResponse.json({ temporaryPassword: result.temporaryPassword })
}
