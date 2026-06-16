import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { writeAdminAuditEvent } from '@/lib/aws/audit'
import { archivePatientNotice, getPatientNotice, sanitizePatientNotice } from '@/lib/aws/patientNotices'

type RouteCtx = { params: Promise<{ noticeId: string }> }

export async function POST(_req: NextRequest, ctx: RouteCtx) {
  const admin = await getAdminUser()
  if (!admin || !isAuthorizedAdmin(admin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { noticeId } = await ctx.params
  if (!noticeId) {
    return NextResponse.json({ error: 'Missing noticeId' }, { status: 400 })
  }

  try {
    const existing = await getPatientNotice(noticeId)
    if (!existing) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
    }
    if (existing.status !== 'draft' && existing.status !== 'published') {
      return NextResponse.json({ error: 'Only draft or published notices can be archived' }, { status: 409 })
    }

    const auditMsid = existing.audience_type === 'single_patient' && existing.patient_msid
      ? existing.patient_msid
      : 'all-patients'

    const auditResult = await writeAdminAuditEvent({
      action:      'PATIENT_NOTICE_ARCHIVED',
      adminSub:    admin.sub,
      adminEmail:  admin.email,
      patientMsid: auditMsid,
      noteId:      noticeId,
      details:     `audience=${existing.audience_type} placement=${existing.placement} priority=${existing.priority} previous_status=${existing.status} new_status=archived`,
    })
    if (!auditResult.ok) {
      return NextResponse.json({ error: 'Audit write failed — action aborted' }, { status: 500 })
    }

    const notice = await archivePatientNotice({ noticeId, adminSub: admin.sub, adminEmail: admin.email })
    return NextResponse.json({ notice: sanitizePatientNotice(notice) })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('PATIENT_NOTICES_TABLE_NAME')) {
      return NextResponse.json({ error: 'Notices service not configured' }, { status: 503 })
    }
    const name = (err as { name?: string }).name
    if (name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'Notice could not be archived — it may have changed status' }, { status: 409 })
    }
    console.error('[notices] archive failed', err)
    return NextResponse.json({ error: 'Failed to archive notice' }, { status: 500 })
  }
}
