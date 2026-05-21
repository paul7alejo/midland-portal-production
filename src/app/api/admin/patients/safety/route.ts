import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { getPatientByMSID, setPatientSafetyStatus } from '@/lib/aws/dynamodb'
import { writeAdminAuditEvent } from '@/lib/aws/audit'

const MSID_RE = /^MS-\d+$/
const ORG_ID = 'midland-sleep'

export async function POST(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin || !isAuthorizedAdmin(admin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const msid               = typeof payload.msid === 'string' ? payload.msid.trim() : ''
  const safetyCheckRequired = payload.safety_check_required

  if (!MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Invalid MSID' }, { status: 400 })
  }
  if (typeof safetyCheckRequired !== 'boolean') {
    return NextResponse.json({ error: 'safety_check_required must be a boolean' }, { status: 400 })
  }

  const patient = await getPatientByMSID(msid, ORG_ID)
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  // Audit before mutation — abort if audit write fails
  const auditResult = await writeAdminAuditEvent({
    action:      'PATIENT_SAFETY_STATUS_UPDATED',
    adminSub:    admin.sub,
    adminEmail:  admin.email,
    patientMsid: msid,
  })
  if (!auditResult.ok) {
    return NextResponse.json({ error: 'Audit write failed — action aborted' }, { status: 500 })
  }

  await setPatientSafetyStatus({
    pk:                  patient.pk,
    safetyCheckRequired,
    adminSub:            admin.sub,
    adminEmail:          admin.email,
  })

  return NextResponse.json({ ok: true, safety_check_required: safetyCheckRequired })
}
