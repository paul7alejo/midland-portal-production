import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { writeAdminAuditEvent } from '@/lib/aws/audit'
import { findConflictingPublishedNotice, getPatientNotice, publishPatientNotice, sanitizePatientNotice } from '@/lib/aws/patientNotices'

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
    if (existing.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft notices can be published' }, { status: 409 })
    }

    if (existing.audience_type === 'all_patients') {
      const conflict = await findConflictingPublishedNotice({
        placement:       existing.placement,
        priority:        existing.priority,
        excludeNoticeId: noticeId,
        startsAt:        existing.starts_at,
        expiresAt:       existing.expires_at,
      })
      if (conflict) {
        const placementLabel: Record<string, string> = {
          top_strip:         'top strip',
          notification_bell: 'notification bell',
          dashboard_card:    'dashboard card',
        }
        return NextResponse.json({
          error: `An all-patient ${placementLabel[existing.placement] ?? existing.placement} ${existing.priority} notice already overlaps this schedule. Expire, archive, or reschedule the existing notice before publishing another.`,
        }, { status: 409 })
      }
    }

    const auditMsid = existing.audience_type === 'single_patient' && existing.patient_msid
      ? existing.patient_msid
      : 'all-patients'

    const auditResult = await writeAdminAuditEvent({
      action:      'PATIENT_NOTICE_PUBLISHED',
      adminSub:    admin.sub,
      adminEmail:  admin.email,
      patientMsid: auditMsid,
      noteId:      noticeId,
      details:     `audience=${existing.audience_type} placement=${existing.placement} priority=${existing.priority} previous_status=draft new_status=published`,
    })
    if (!auditResult.ok) {
      return NextResponse.json({ error: 'Audit write failed — action aborted' }, { status: 500 })
    }

    const notice = await publishPatientNotice({ noticeId, adminSub: admin.sub, adminEmail: admin.email })
    return NextResponse.json({ notice: sanitizePatientNotice(notice) })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('PATIENT_NOTICES_TABLE_NAME')) {
      return NextResponse.json({ error: 'Notices service not configured' }, { status: 503 })
    }
    const name = (err as { name?: string }).name
    if (name === 'ConditionalCheckFailedException') {
      return NextResponse.json({ error: 'Notice could not be published — it may have changed status' }, { status: 409 })
    }
    console.error('[notices] publish failed', err)
    return NextResponse.json({ error: 'Failed to publish notice' }, { status: 500 })
  }
}
