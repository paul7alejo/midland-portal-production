import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser, safeLog, HttpError } from '@/lib/security';
import { getPatientDevices, getPatientMask, getPatientEntitlement } from '@/lib/aws/dynamodb';

export async function GET(request: NextRequest) {
  try {
    const user = await getVerifiedUser(request);
    const { msid, orgId } = user;

    safeLog('patient/data: fetching data', { msid, orgId });

    const [device, mask, entitlement] = await Promise.all([
      getPatientDevices(msid, orgId),
      getPatientMask(msid, orgId),
      getPatientEntitlement(msid, 2026, orgId),
    ]);

    return NextResponse.json({ device, mask, entitlement });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    safeLog('patient/data: unexpected error', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
