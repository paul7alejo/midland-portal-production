import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser, safeLog, HttpError } from '@/lib/security';
import { getPatientByMSID, appendAuditLog, countAuditEventsSince } from '@/lib/aws/dynamodb';
import { decryptNHI, maskNHI } from '@/lib/nhi';

const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const user = await getVerifiedUser(request);
    const { msid, orgId, sub } = user;

    const recentCount = await countAuditEventsSince(sub, 'NHI_REVEALED', Date.now() - WINDOW_MS);
    if (recentCount >= RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 5 NHI reveals per hour.' },
        { status: 429 }
      );
    }

    const patient = await getPatientByMSID(msid, orgId);
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    if (!patient.nhi_encrypted) return NextResponse.json({ error: 'NHI not on file' }, { status: 404 });

    // Audit BEFORE decryption
    await appendAuditLog({
      userId: sub,
      event_type: 'NHI_REVEALED',
      msid,
      org_id: orgId,
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
    });

    const plaintext = await decryptNHI(patient.nhi_encrypted);

    safeLog('patient/nhi-reveal: revealed', { msid: maskNHI(msid), sub });

    return NextResponse.json({ nhi: plaintext });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('patient/nhi-reveal POST ERROR:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}
