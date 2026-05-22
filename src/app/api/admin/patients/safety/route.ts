import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { getPatientByMSID, setPatientSafetyStatus, setSafetyCautionDetails } from '@/lib/aws/dynamodb'
import { writeAdminAuditEvent } from '@/lib/aws/audit'

const MSID_RE = /^MS-\d+$/
const ORG_ID = 'midland-sleep'
const VALID_SEVERITIES = ['low', 'medium', 'high']

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
  const msid = typeof payload.msid === 'string' ? payload.msid.trim() : ''

  if (!MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Invalid MSID' }, { status: 400 })
  }

  const patient = await getPatientByMSID(msid, ORG_ID)
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  // ── Branch: flag toggle vs detail-only update ─────────────────────────────
  if ('safety_check_required' in payload) {
    const safetyCheckRequired = payload.safety_check_required
    if (typeof safetyCheckRequired !== 'boolean') {
      return NextResponse.json({ error: 'safety_check_required must be a boolean' }, { status: 400 })
    }

    const resolvedNote =
      !safetyCheckRequired && typeof payload.safety_resolved_note === 'string'
        ? payload.safety_resolved_note
        : undefined

    const auditResult = await writeAdminAuditEvent({
      action:      'PATIENT_SAFETY_STATUS_UPDATED',
      adminSub:    admin.sub,
      adminEmail:  admin.email,
      patientMsid: msid,
      details:     safetyCheckRequired
        ? 'Safety check flag set'
        : resolvedNote
          ? 'Cleared with resolution note'
          : 'Safety check flag cleared',
    })
    if (!auditResult.ok) {
      return NextResponse.json({ error: 'Audit write failed — action aborted' }, { status: 500 })
    }

    await setPatientSafetyStatus({
      pk:                  patient.pk,
      safetyCheckRequired,
      resolvedNote,
      adminSub:            admin.sub,
      adminEmail:          admin.email,
    })

    return NextResponse.json({ ok: true, safety_check_required: safetyCheckRequired })
  }

  // ── Detail-only update path ───────────────────────────────────────────────
  const cautionReason = typeof payload.safety_caution_reason === 'string' ? payload.safety_caution_reason : ''
  const severity      = typeof payload.safety_severity      === 'string' ? payload.safety_severity      : ''
  const dueDate       = typeof payload.safety_due_date      === 'string' ? payload.safety_due_date      : ''
  const assignedTo    = typeof payload.safety_assigned_to   === 'string' ? payload.safety_assigned_to   : ''

  if (severity && !VALID_SEVERITIES.includes(severity)) {
    return NextResponse.json({ error: 'Invalid severity value' }, { status: 400 })
  }

  const updatedFields = [
    cautionReason && 'reason',
    severity && 'severity',
    dueDate && 'due date',
    assignedTo && 'assigned-to',
  ].filter(Boolean).join(', ')

  const auditResult = await writeAdminAuditEvent({
    action:      'PATIENT_SAFETY_DETAILS_UPDATED',
    adminSub:    admin.sub,
    adminEmail:  admin.email,
    patientMsid: msid,
    details:     updatedFields ? `Updated: ${updatedFields}` : 'Admin caution details saved',
  })
  if (!auditResult.ok) {
    return NextResponse.json({ error: 'Audit write failed — action aborted' }, { status: 500 })
  }

  await setSafetyCautionDetails({
    pk:           patient.pk,
    cautionReason,
    severity,
    dueDate,
    assignedTo,
    adminSub:     admin.sub,
    adminEmail:   admin.email,
  })

  return NextResponse.json({ ok: true })
}
