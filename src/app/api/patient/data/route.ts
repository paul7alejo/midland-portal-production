import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser, safeLog, HttpError } from '@/lib/security';
import {
  getPatientByMSID,
  getPatientDevices,
  getPatientMask,
  getPatientEntitlement,
  listPatientPortalUpdates,
} from '@/lib/aws/dynamodb';

export async function GET(request: NextRequest) {
  try {
    const user = await getVerifiedUser(request);
    const { msid, orgId } = user;

    safeLog('patient/data: fetching data', { msid, orgId });

    const patient = await getPatientByMSID(msid, orgId);
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const patientMsid = patient.portal_id ?? msid;

    const [devices, mask, entitlement, updates] = await Promise.all([
      getPatientDevices(patient.patient_id, orgId),
      getPatientMask(patient.patient_id, orgId),
      getPatientEntitlement(patient.patient_id, 2026, orgId),
      listPatientPortalUpdates({ patientMsid, orgId, limit: 3 }).catch((err) => {
        console.warn('patient/data updates unavailable:', err instanceof Error ? err.message : String(err));
        return [];
      }),
    ]);
    const device = devices[0] ?? null;

    return NextResponse.json({ device, mask, entitlement, updates });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('patient/data ERROR:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
