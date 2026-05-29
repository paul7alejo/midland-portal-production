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

  // Determine cookie name by detecting admin identity — mirroring
  // isAuthorizedAdmin() in src/lib/security.ts (keep in sync if lists change).
  // Cannot use presence of custom:msid/custom:org_id because the admin account
  // also carries those Cognito attributes (custom:msid = 'MS-000000').
  const claims = decodeTokenClaims(token)
  const ADMIN_ROLES     = new Set(['clinic-staff', 'admin', 'staff'])
  const ADMIN_USERNAMES = new Set(['midland-admin'])
  const ADMIN_EMAILS    = new Set(['admin@midlandsleep.co.nz'])
  const isAdmin =
    ADMIN_ROLES.has(String(claims['custom:role'] ?? '')) ||
    claims['custom:is_dev'] === 'true' ||
    ADMIN_USERNAMES.has(String(claims['cognito:username'] ?? '')) ||
    ADMIN_EMAILS.has(String(claims['email'] ?? ''))
  const cookieName = isAdmin ? 'id_token' : 'portal_token'

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
