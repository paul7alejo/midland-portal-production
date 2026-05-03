import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser, safeLog, HttpError } from '@/lib/security';
import { getPatientByMSID, getPatientDevices, getPatientMask, getPatientEntitlement } from '@/lib/aws/dynamodb';

export async function GET(request: NextRequest) {
  try {
    const user = await getVerifiedUser(request);
    const { msid, orgId } = user;

    safeLog('patient/data: fetching data', { msid, orgId });

    const patient = await getPatientByMSID(msid, orgId);
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const [devices, mask, entitlement] = await Promise.all([
      getPatientDevices(patient.patient_id, orgId),
      getPatientMask(patient.patient_id, orgId),
      getPatientEntitlement(patient.patient_id, 2026, orgId),
    ]);
    const device = devices[0] ?? null;

    return NextResponse.json({ device, mask, entitlement });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    safeLog('patient/data: unexpected error', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
