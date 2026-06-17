import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getVerifiedUser, HttpError, safeLog } from '@/lib/security'
import { getPatientByMSID } from '@/lib/aws/dynamodb'
import { listPublishedNoticesForPatient } from '@/lib/aws/patientNotices'

async function getPatientContext(request: NextRequest) {
  const user = await getVerifiedUser(request)
  const patient = await getPatientByMSID(user.msid, user.orgId)
  if (!patient) throw new HttpError(404, 'Patient not found')
  return { orgId: user.orgId, patientMsid: patient.portal_id ?? user.msid }
}

export async function GET(request: NextRequest) {
  try {
    const { orgId, patientMsid } = await getPatientContext(request)
    safeLog('patient/notices: fetching notices', { orgId })
    const notices = await listPublishedNoticesForPatient(patientMsid)
    return NextResponse.json({ notices })
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('patient/notices GET ERROR:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
