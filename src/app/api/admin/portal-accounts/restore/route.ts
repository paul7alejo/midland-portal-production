import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { writeAdminAuditEvent } from '@/lib/aws/audit'
import { unlockPatientPortalAccount } from '@/lib/aws/cognito-admin'
import { restorePatientByMsid, archivePatientByMsid } from '@/lib/aws/dynamodb'

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

  if (confirmationToken !== 'RESTORE') {
    return NextResponse.json({ error: 'RESTORE confirmation is required' }, { status: 400 })
  }

  const username = msid.slice(3)  // strip "MS-"

  // 1. Audit intent — abort before any action if audit fails
  const audit = await writeAdminAuditEvent({
    action:      'PORTAL_ACCOUNT_RESTORED',
    adminSub:    user.sub,
    adminEmail:  user.email,
    patientMsid: msid,
    details:     'Portal account restore requested by admin',
  })

  if (!audit.ok) {
    return NextResponse.json(
      { error: 'Audit write failed — action not taken' },
      { status: 500 }
    )
  }

  // 2. Unarchive linked patient FIRST — validates source and restore window
  const restoreResult = await restorePatientByMsid({
    msid,
    adminSub:   user.sub,
    adminEmail: user.email,
    orgId:      ORG_ID,
  })

  if (!restoreResult.ok) {
    const { reason } = restoreResult
    if (reason === 'not_found') {
      return NextResponse.json({ error: 'Patient record not found' }, { status: 404 })
    }
    if (reason === 'not_archived') {
      return NextResponse.json(
        { error: 'Patient record is not archived — nothing to restore' },
        { status: 409 }
      )
    }
    if (reason === 'wrong_source') {
      return NextResponse.json(
        { error: 'Patient record was not archived via the portal account delete flow — cannot restore from this route' },
        { status: 409 }
      )
    }
    if (reason === 'restore_window_expired') {
      return NextResponse.json(
        { error: 'Restore window has expired — permanent purge required before re-onboarding' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Patient restore failed' }, { status: 500 })
  }

  // 3. Re-enable Cognito portal user
  const enableResult = await unlockPatientPortalAccount(username)
  if (enableResult.status === 'error') {
    // Compensate: attempt to re-archive patient to restore consistent state
    const compensate = await archivePatientByMsid({
      msid,
      adminSub:   user.sub,
      adminEmail: user.email,
      orgId:      ORG_ID,
    })
    const note = compensate.ok
      ? 'Patient restore has been rolled back'
      : 'Patient restore rollback also failed — manual review required'
    console.error('[portal-accounts/restore] Cognito enable failed after patient unarchive', {
      msid,
      cognitoError: enableResult.message,
      compensated:  compensate.ok,
    })
    return NextResponse.json(
      { error: `Portal account enable failed: ${enableResult.message} — ${note}` },
      { status: 500 }
    )
  }

  // 4. Audit successful restore
  const finalAudit = await writeAdminAuditEvent({
    action:      'LINKED_PATIENT_RESTORED',
    adminSub:    user.sub,
    adminEmail:  user.email,
    patientMsid: msid,
    details:     'Patient record unarchived as part of portal account restore',
  })

  if (!finalAudit.ok) {
    return NextResponse.json(
      { error: 'Audit logging failed after restore operation — manual review required' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, patientRestored: true })
}
