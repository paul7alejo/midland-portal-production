import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, HttpError } from '@/lib/security';

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

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'id_token',
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
  return response;
}
