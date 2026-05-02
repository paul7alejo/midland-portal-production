import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected and public routes
  const protectedRoutes = ['/portal/', '/admin/', '/api/'];
  const publicRoutes = ['/', '/login', '/register', '/api/auth/', '/_next/', '/favicon.ico'];
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) && !pathname.startsWith('/api/auth/')
  );
  
  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  // Check for Amplify auth cookie (aws-amplify v6 uses cookies)
  const hasAuthCookie = request.cookies.has('amplify-signin-with-hostedUI');
  
  // Route protection logic
  if (isProtectedRoute && !hasAuthCookie) {
    // Redirect to home page if not authenticated
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Add security headers to every response
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://cognito-idp.ap-southeast-2.amazonaws.com"
  );
  
  return response;
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*', '/api/:path*', '/']
};