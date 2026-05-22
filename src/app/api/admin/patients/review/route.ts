import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { getPatientByMSID, setPatientReviewStatus } from '@/lib/aws/dynamodb'
import { writeAdminAuditEvent } from '@/lib/aws/audit'

const MSID_RE = /^MS-\d+$/
const ORG_ID = 'midland-sleep'
const ALLOWED_STATUSES = ['pending_review', 'reviewed'] as const
type ReviewStatus = (typeof ALLOWED_STATUSES)[number]

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
  const msid         = typeof payload.msid          === 'string' ? payload.msid.trim()          : ''
  const reviewStatus = typeof payload.review_status === 'string' ? payload.review_status.trim() : ''

  if (!MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Invalid MSID' }, { status: 400 })
  }
  if (!(ALLOWED_STATUSES as readonly string[]).includes(reviewStatus)) {
    return NextResponse.json({ error: 'Invalid review_status — must be pending_review or reviewed' }, { status: 400 })
  }

  const patient = await getPatientByMSID(msid, ORG_ID)
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  // Audit before mutation — abort if audit write fails
  const auditResult = await writeAdminAuditEvent({
    action:       'PATIENT_REVIEW_STATUS_UPDATED',
    adminSub:     admin.sub,
    adminEmail:   admin.email,
    patientMsid:  msid,
    details:      reviewStatus === 'reviewed' ? 'Status set to: Reviewed' : 'Status set to: Pending review',
  })
  if (!auditResult.ok) {
    return NextResponse.json({ error: 'Audit write failed — action aborted' }, { status: 500 })
  }

  await setPatientReviewStatus({
    pk:           patient.pk,
    reviewStatus: reviewStatus as ReviewStatus,
    adminSub:     admin.sub,
    adminEmail:   admin.email,
  })

  return NextResponse.json({ ok: true, review_status: reviewStatus })
}
