import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { writeAdminAuditEvent } from '@/lib/aws/audit'
import { archivePatientByMsid, listPatients } from '@/lib/aws/dynamodb'
import { listPortalUsers } from '@/lib/aws/cognito-admin'

const ORG_ID = 'midland-sleep'
const MSID_RE = /^MS-\d+$/
const MAX_REASON_LENGTH = 240

function normalizeMsid(msid: string): string {
  const value = msid.trim()
  return value.startsWith('MS-') ? value : `MS-${value}`
}

function sanitizeReason(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, MAX_REASON_LENGTH)
}

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

  const { msid, confirmationToken, reason } = body as Record<string, unknown>
  if (typeof msid !== 'string' || !MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Valid MSID is required' }, { status: 400 })
  }

  if (confirmationToken !== 'DELETE') {
    return NextResponse.json({ error: 'DELETE confirmation is required' }, { status: 400 })
  }

  const archiveReason = sanitizeReason(reason)

  try {
    const [patients, portalUsers] = await Promise.all([
      listPatients(ORG_ID),
      listPortalUsers(),
    ])

    const canonicalMsid = normalizeMsid(msid)
    const activePatient = patients.find((patient) => normalizeMsid(patient.portal_id) === canonicalMsid)
    if (!activePatient) {
      return NextResponse.json({ error: 'Active patient record not found' }, { status: 404 })
    }

    const hasPortalAccount = portalUsers.some((portalUser) => normalizeMsid(portalUser.msid) === canonicalMsid)
    if (hasPortalAccount) {
      return NextResponse.json(
        { error: 'This patient has a portal account. Use Portal Accounts → Move to Bin.' },
        { status: 400 }
      )
    }

    const requestedAudit = await writeAdminAuditEvent({
      action:      'PATIENT_RECONCILIATION_ARCHIVE_REQUESTED',
      adminSub:    user.sub,
      adminEmail:  user.email,
      patientMsid: canonicalMsid,
      details:     archiveReason
        ? 'No-portal patient archive requested from reconciliation report with admin reason'
        : 'No-portal patient archive requested from reconciliation report',
    })

    if (!requestedAudit.ok) {
      return NextResponse.json({ error: 'Audit write failed — action not taken' }, { status: 500 })
    }

    const archiveResult = await archivePatientByMsid({
      msid:           canonicalMsid,
      adminSub:       user.sub,
      adminEmail:     user.email,
      orgId:          ORG_ID,
      archiveSource:  'patients_portal_reconciliation',
      archiveReason,
    })

    if (!archiveResult.ok) {
      if (archiveResult.reason === 'not_found') {
        return NextResponse.json({ error: 'Active patient record not found' }, { status: 404 })
      }
      if (archiveResult.reason === 'already_archived') {
        return NextResponse.json({ error: 'Patient record is already archived' }, { status: 409 })
      }
      console.error('[patients-portal/archive-patient] archive failed', {
        msid: canonicalMsid,
        reason: archiveResult.reason,
      })
      return NextResponse.json({ error: 'Patient archive failed' }, { status: 500 })
    }

    const finalAudit = await writeAdminAuditEvent({
      action:      'PATIENT_RECONCILIATION_ARCHIVED',
      adminSub:    user.sub,
      adminEmail:  user.email,
      patientMsid: canonicalMsid,
      details:     'No-portal patient soft-archived from reconciliation report',
    })

    if (!finalAudit.ok) {
      return NextResponse.json(
        { error: 'Audit logging failed after archive operation — manual review required' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, msid: canonicalMsid })
  } catch (err: unknown) {
    console.error('[patients-portal/archive-patient] request failed', {
      errorName: err instanceof Error ? err.name : 'UnknownError',
    })
    return NextResponse.json({ error: 'Patient archive failed' }, { status: 500 })
  }
}
