import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser, safeLog, HttpError } from '@/lib/security';
import { getPatientByMSID, updatePatientProfile, appendAuditLog } from '@/lib/aws/dynamodb';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: NextRequest) {
  try {
    const user = await getVerifiedUser(request);
    const { msid, orgId } = user;

    const patient = await getPatientByMSID(msid, orgId);
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    return NextResponse.json({
      name: patient.name,
      email: patient.email,
      msid: patient.portal_id,
      org_id: patient.org_id,
      address_structured: patient.address_structured ?? null,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errorName = err instanceof Error ? err.name : 'UnknownError';
    console.error('patient/profile GET ERROR:', { errorName });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getVerifiedUser(request);
    const { msid, orgId, sub } = user;

    const body = await request.json() as Record<string, unknown>;

    const allowed = new Set(['name', 'email']);
    for (const key of Object.keys(body)) {
      if (!allowed.has(key)) {
        return NextResponse.json({ error: `Field '${key}' cannot be updated` }, { status: 400 });
      }
    }

    const fields: { name?: string; email?: string } = {};
    const { name, email } = body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.length === 0 || name.length > 100) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
      }
      fields.name = name;
    }
    if (email !== undefined) {
      if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      }
      fields.email = email;
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const patient = await getPatientByMSID(msid, orgId);
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    await updatePatientProfile(patient.pk, fields);

    safeLog('patient/profile: profile updated', { msid, fields_changed: Object.keys(fields) });

    await appendAuditLog({
      userId: sub,
      event_type: 'PROFILE_UPDATED',
      fields_changed: Object.keys(body),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const errorName = err instanceof Error ? err.name : 'UnknownError';
    console.error('patient/profile PATCH ERROR:', { errorName });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
