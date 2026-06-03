import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { writeAdminAuditEvent } from '@/lib/aws/audit'
import { disablePatientPortalAccount } from '@/lib/aws/cognito-admin'
import { archivePatientByMsid, restorePatientByMsid } from '@/lib/aws/dynamodb'

const MSID_RE = /^MS-\d+$/
const ORG_ID  = 'midland-sleep'

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

  const { msid, confirmationToken } = body as Record<string, unknown>

  if (typeof msid !== 'string' || !MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Valid MSID is required' }, { status: 400 })
  }

  if (confirmationToken !== 'DELETE') {
    return NextResponse.json({ error: 'DELETE confirmation is required' }, { status: 400 })
  }

  const username = msid.slice(3)  // strip "MS-"

  // 1. Audit intent — abort before any action if audit fails
  const audit = await writeAdminAuditEvent({
    action:      'PORTAL_ACCOUNT_ARCHIVED',
    adminSub:    user.sub,
    adminEmail:  user.email,
    patientMsid: msid,
    details:     'Portal account archive requested by admin',
  })

  if (!audit.ok) {
    return NextResponse.json(
      { error: 'Audit write failed — action not taken' },
      { status: 500 }
    )
  }

  // 2. Archive linked patient record FIRST to avoid split state
  const archiveResult = await archivePatientByMsid({
    msid,
    adminSub:   user.sub,
    adminEmail: user.email,
    orgId:      ORG_ID,
  })

  if (!archiveResult.ok) {
    if (archiveResult.reason === 'not_found') {
      return NextResponse.json(
        { error: 'Linked patient record not found — portal account not archived' },
        { status: 404 }
      )
    }
    if (archiveResult.reason === 'already_archived') {
      return NextResponse.json(
        { error: 'Patient record is already archived — if portal account is still active, manual review is required' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Patient archive failed — portal account not archived' },
      { status: 500 }
    )
  }

  // 3. Disable Cognito portal user
  const disableResult = await disablePatientPortalAccount(username)
  if (disableResult.status === 'error') {
    // Compensate: attempt to unarchive patient to restore consistent state
    const compensate = await restorePatientByMsid({
      msid,
      adminSub:   user.sub,
      adminEmail: user.email,
      orgId:      ORG_ID,
    })
    const note = compensate.ok
      ? 'Patient archive has been rolled back'
      : 'Patient archive rollback also failed — manual review required'
    console.error('[portal-accounts/delete] Cognito disable failed after patient archive', {
      msid,
      cognitoError: disableResult.message,
      compensated:  compensate.ok,
    })
    return NextResponse.json(
      { error: `Portal account disable failed: ${disableResult.message} — ${note}` },
      { status: 500 }
    )
  }

  // 4. Audit successful archive
  const finalAudit = await writeAdminAuditEvent({
    action:      'LINKED_PATIENT_ARCHIVED',
    adminSub:    user.sub,
    adminEmail:  user.email,
    patientMsid: msid,
    details:     'Patient record soft-archived as part of portal account delete',
  })

  if (!finalAudit.ok) {
    return NextResponse.json(
      { error: 'Audit logging failed after archive operation — manual review required' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
