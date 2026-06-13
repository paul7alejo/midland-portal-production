import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser, safeLog, HttpError } from '@/lib/security';
import {
  getPatientByMSID,
  getPatientDevices,
  getPatientMask,
  getPatientEntitlement,
  listPatientPortalUpdates,
  type PatientPortalUpdateRecord,
} from '@/lib/aws/dynamodb';

function toSafePortalUpdate(update: PatientPortalUpdateRecord) {
  return {
    notification_id: update.notification_id,
    request_id: update.request_id,
    request_reference: update.request_reference,
    title: update.title,
    message: update.message,
    created_at: update.created_at,
    read_at: update.read_at ?? null,
    channel: update.channel,
    delivery_status: update.delivery_status,
  };
}

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
      listPatientPortalUpdates({ patientMsid, orgId }).catch((err) => {
        console.warn('patient/data updates unavailable:', err instanceof Error ? err.message : String(err));
        return [];
      }),
    ]);
    const device = devices[0] ?? null;
    const safeUpdates = updates.map(toSafePortalUpdate);
    const unreadNotificationCount = safeUpdates.filter((update) => !update.read_at).length;

    return NextResponse.json({
      device,
      mask,
      entitlement,
      updates: safeUpdates.slice(0, 10),
      unreadNotificationCount,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('patient/data ERROR:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
