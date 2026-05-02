import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Amplify v6 persists the last authenticated username under this key
// (localStorage in browser; same key pattern in cookie-based SSR storage).
// Checking its presence is a fast optimistic session test — actual JWT
// verification happens inside each route handler via getVerifiedUser().
const AUTH_COOKIE = `CognitoIdentityServiceProvider.${process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID}.LastAuthUser`

const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security':  'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options':     'nosniff',
  'X-Frame-Options':            'DENY',
  'X-XSS-Protection':          '1; mode=block',
  'Referrer-Policy':            'strict-origin-when-cross-origin',
  'Permissions-Policy':         'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://cognito-idp.ap-southeast-2.amazonaws.com",
  ].join('; '),
}

function isProtected(pathname: string): boolean {
  return (
    pathname.startsWith('/portal') ||
    pathname.startsWith('/admin') ||
    (pathname.startsWith('/api') && !pathname.startsWith('/api/auth'))
  )
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  if (isProtected(pathname) && !request.cookies.has(AUTH_COOKIE)) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
  }

  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/admin/:path*',
    '/api/:path*',
    '/',
  ],
}
