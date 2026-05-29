import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, HttpError } from '@/lib/security';

// Decode JWT payload without re-verifying (signature already checked by
// verifyIdToken before this runs).  Used only to route to the right cookie.
function decodeTokenClaims(token: string): Record<string, unknown> {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }
  const token = auth.slice(7);

  try {
    await verifyIdToken(token);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 401;
    return NextResponse.json({ error: 'Invalid token' }, { status });
  }

  // Patient tokens carry custom:msid + custom:org_id; admin tokens do not.
  // Route each to its own cookie so they cannot overwrite each other.
  const claims = decodeTokenClaims(token)
  const isPatient =
    typeof claims['custom:msid'] === 'string' &&
    typeof claims['custom:org_id'] === 'string'
  const cookieName = isPatient ? 'portal_token' : 'id_token'

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: cookieName,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('id_token');
  response.cookies.delete('portal_token');
  return response;
}
