import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { writeAdminAuditEvent } from '@/lib/aws/audit'
import {
  createPatientNotice,
  listPatientNotices,
  sanitizePatientNotice,
  type NoticeAudienceType,
  type NoticePlacement,
  type NoticePriority,
} from '@/lib/aws/patientNotices'

const VALID_AUDIENCE:   Set<string> = new Set(['all_patients', 'single_patient'])
const VALID_PLACEMENT:  Set<string> = new Set(['top_strip', 'notification_bell', 'dashboard_card'])
const VALID_PRIORITY:   Set<string> = new Set(['info', 'reminder', 'important'])
const TITLE_MAX   = 120
const MESSAGE_MAX = 500

// Accepts "148534", "MS-148534", "ms-148534" → "MS-148534". Returns null if invalid.
function normalizeMsid(raw: string): string | null {
  const v = raw.trim()
  if (/^\d+$/.test(v)) return `MS-${v}`
  const m = /^MS-(\d+)$/i.exec(v)
  if (m) return `MS-${m[1]}`
  return null
}

export async function GET() {
  const admin = await getAdminUser()
  if (!admin || !isAuthorizedAdmin(admin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const notices = await listPatientNotices()
    return NextResponse.json({ notices: notices.map(sanitizePatientNotice) })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('PATIENT_NOTICES_TABLE_NAME')) {
      return NextResponse.json({ error: 'Notices service not configured' }, { status: 503 })
    }
    console.error('[notices] GET failed', err)
    return NextResponse.json({ error: 'Failed to load notices' }, { status: 500 })
  }
}

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

  const payload      = body as Record<string, unknown>
  const title        = typeof payload.title   === 'string' ? payload.title.trim()   : ''
  const message      = typeof payload.message === 'string' ? payload.message.trim() : ''
  const audience_type = typeof payload.audience_type === 'string' ? payload.audience_type : ''
  const placement    = typeof payload.placement  === 'string' ? payload.placement  : ''
  const priority     = typeof payload.priority   === 'string' ? payload.priority   : ''
  const patient_msid = typeof payload.patient_msid === 'string' ? payload.patient_msid.trim() : undefined
  const starts_at    = typeof payload.starts_at  === 'string' ? payload.starts_at.trim()  : undefined
  const expires_at   = typeof payload.expires_at  === 'string' ? payload.expires_at.trim()  : undefined

  if (!title)                              return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (title.length > TITLE_MAX)            return NextResponse.json({ error: `title must be ${TITLE_MAX} characters or fewer` }, { status: 400 })
  if (!message)                            return NextResponse.json({ error: 'message is required' }, { status: 400 })
  if (message.length > MESSAGE_MAX)        return NextResponse.json({ error: `message must be ${MESSAGE_MAX} characters or fewer` }, { status: 400 })
  if (!VALID_AUDIENCE.has(audience_type))  return NextResponse.json({ error: 'audience_type must be all_patients or single_patient' }, { status: 400 })
  if (!VALID_PLACEMENT.has(placement))     return NextResponse.json({ error: 'placement must be top_strip, notification_bell, or dashboard_card' }, { status: 400 })
  if (!VALID_PRIORITY.has(priority))       return NextResponse.json({ error: 'priority must be info, reminder, or important' }, { status: 400 })

  let normalized_msid: string | undefined
  if (audience_type === 'single_patient') {
    if (!patient_msid) {
      return NextResponse.json({ error: 'patient_msid is required for single_patient audience' }, { status: 400 })
    }
    const norm = normalizeMsid(patient_msid)
    if (!norm) {
      return NextResponse.json({ error: 'Enter a valid MSID, e.g. 148534 or MS-148534' }, { status: 400 })
    }
    normalized_msid = norm
  }

  // Audit-first — abort before any write if audit fails
  const auditMsid = audience_type === 'single_patient' && normalized_msid ? normalized_msid : 'all-patients'
  const auditResult = await writeAdminAuditEvent({
    action:      'PATIENT_NOTICE_CREATED',
    adminSub:    admin.sub,
    adminEmail:  admin.email,
    patientMsid: auditMsid,
    details:     `audience=${audience_type} placement=${placement} priority=${priority}`,
  })
  if (!auditResult.ok) {
    return NextResponse.json({ error: 'Audit write failed — action aborted' }, { status: 500 })
  }

  try {
    const notice = await createPatientNotice({
      title,
      message,
      audience_type: audience_type as NoticeAudienceType,
      ...(audience_type === 'single_patient' && normalized_msid ? { patient_msid: normalized_msid } : {}),
      placement:  placement  as NoticePlacement,
      priority:   priority   as NoticePriority,
      ...(starts_at  ? { starts_at  } : {}),
      ...(expires_at ? { expires_at } : {}),
      adminSub:   admin.sub,
      adminEmail: admin.email,
    })
    return NextResponse.json({ notice: sanitizePatientNotice(notice) }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('PATIENT_NOTICES_TABLE_NAME')) {
      return NextResponse.json({ error: 'Notices service not configured' }, { status: 503 })
    }
    console.error('[notices] POST failed', err)
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 })
  }
}
