import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import {
  listPatientNotes,
  putPatientNote,
  getPatientNote,
  updatePatientNote,
  softDeletePatientNote,
} from '@/lib/aws/dynamodb'
import { writeAdminAuditEvent } from '@/lib/aws/audit'

const MSID_RE = /^MS-\d+$/
// NOTE#<timestamp_ms>#<uuid>
const NOTE_SK_RE = /^NOTE#\d+#[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const ORG_ID = 'midland-sleep'
const NOTE_MAX_LEN = 1000

export async function GET(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin || !isAuthorizedAdmin(admin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const msid = req.nextUrl.searchParams.get('msid') ?? ''
  if (!MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Invalid msid' }, { status: 400 })
  }

  const records = await listPatientNotes(msid, ORG_ID)
  return NextResponse.json({
    notes: records.map((n) => ({
      note_id: n.sk,
      patient_msid: n.patient_msid,
      body: n.body,
      created_at: n.created_at,
      created_by_email: n.created_by_email,
      is_owner: n.created_by === admin.sub,
      updated_at: n.updated_at ?? null,
      is_edited: n.is_edited ?? false,
    })),
  })
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

  const payload = body as Record<string, unknown>
  const msid = typeof payload.msid === 'string' ? payload.msid.trim() : ''
  const noteBody = typeof payload.body === 'string' ? payload.body.trim() : ''

  if (!MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Invalid msid' }, { status: 400 })
  }
  if (!noteBody || noteBody.length > NOTE_MAX_LEN) {
    return NextResponse.json({ error: 'body must be 1–1000 characters' }, { status: 400 })
  }

  const record = await putPatientNote({
    msid,
    orgId: ORG_ID,
    body: noteBody,
    adminSub: admin.sub,
    adminEmail: admin.email,
  })
  return NextResponse.json({
    ok: true,
    note: {
      note_id: record.sk,
      patient_msid: record.patient_msid,
      body: record.body,
      created_at: record.created_at,
      created_by_email: record.created_by_email,
      is_owner: true,
      updated_at: null,
      is_edited: false,
    },
  })
}

export async function PATCH(req: NextRequest) {
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
  const noteId = typeof payload.note_id === 'string' ? payload.note_id.trim() : ''
  const noteBody = typeof payload.body === 'string' ? payload.body.trim() : ''

  if (!MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Invalid msid' }, { status: 400 })
  }
  if (!NOTE_SK_RE.test(noteId)) {
    return NextResponse.json({ error: 'Invalid note_id' }, { status: 400 })
  }
  if (!noteBody || noteBody.length > NOTE_MAX_LEN) {
    return NextResponse.json({ error: 'body must be 1–1000 characters' }, { status: 400 })
  }

  const note = await getPatientNote(msid, noteId, ORG_ID)
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 })
  }
  if (note.is_deleted) {
    return NextResponse.json({ error: 'Note has been deleted' }, { status: 409 })
  }
  if (note.created_by !== admin.sub) {
    return NextResponse.json({ error: 'You can only edit notes you created' }, { status: 403 })
  }

  const auditResult = await writeAdminAuditEvent({
    action: 'NOTE_UPDATED',
    adminSub: admin.sub,
    adminEmail: admin.email,
    patientMsid: msid,
    noteId,
  })
  if (!auditResult.ok) {
    return NextResponse.json({ error: 'Audit write failed — edit aborted' }, { status: 500 })
  }

  await updatePatientNote({
    msid,
    noteSk: noteId,
    body: noteBody,
    adminSub: admin.sub,
    adminEmail: admin.email,
    orgId: ORG_ID,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
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
  const noteId = typeof payload.note_id === 'string' ? payload.note_id.trim() : ''
  const confirmation = typeof payload.confirmation === 'string' ? payload.confirmation : ''

  if (!MSID_RE.test(msid)) {
    return NextResponse.json({ error: 'Invalid msid' }, { status: 400 })
  }
  if (!NOTE_SK_RE.test(noteId)) {
    return NextResponse.json({ error: 'Invalid note_id' }, { status: 400 })
  }
  if (confirmation !== 'DELETE') {
    return NextResponse.json({ error: 'Confirmation text must be DELETE' }, { status: 400 })
  }

  try {
    const note = await getPatientNote(msid, noteId, ORG_ID)
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
    if (note.is_deleted) {
      return NextResponse.json({ error: 'Note already deleted' }, { status: 409 })
    }
    if (note.created_by !== admin.sub) {
      return NextResponse.json({ error: 'You can only delete notes you created' }, { status: 403 })
    }

    const auditResult = await writeAdminAuditEvent({
      action: 'NOTE_SOFT_DELETED',
      adminSub: admin.sub,
      adminEmail: admin.email,
      patientMsid: msid,
      noteId,
    })
    if (!auditResult.ok) {
      return NextResponse.json({ error: 'Audit write failed — delete aborted' }, { status: 500 })
    }

    await softDeletePatientNote({
      msid,
      noteSk: noteId,
      adminSub: admin.sub,
      adminEmail: admin.email,
      orgId: ORG_ID,
    })

    return NextResponse.json({ ok: true, note_id: noteId })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
