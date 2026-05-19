import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, isAuthorizedAdmin } from '@/lib/security'
import { listPatientNotes, putPatientNote } from '@/lib/aws/dynamodb'

const MSID_RE = /^MS-\d+$/
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
    },
  })
}
