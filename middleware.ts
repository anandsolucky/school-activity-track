import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that should be accessible without authentication
const publicPaths = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow access to public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow access to API routes and static files
  if (
    pathname.startsWith('/_next') || // Static files
    pathname.startsWith('/api/') || // API routes
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // For all other routes, we'll let the client-side AuthProvider handle the auth check
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
