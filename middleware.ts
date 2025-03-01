import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that should be accessible without authentication
const publicPaths = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check for authentication cookie/token
  const authToken = request.cookies.get('auth-token')?.value;

  console.log(
    `Middleware processing path: ${pathname}, Auth token present: ${!!authToken}`
  );

  // Allow access to API routes and static files unconditionally
  if (
    pathname.startsWith('/_next') || // Static files
    pathname.startsWith('/api/') || // API routes
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // If user is on the root path, redirect based on auth status
  if (pathname === '/') {
    if (authToken) {
      console.log('User authenticated at root path, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // For non-authenticated users at root, let the client-side handle it
    return NextResponse.next();
  }

  // Allow access to public paths
  if (publicPaths.includes(pathname)) {
    // If user is authenticated and trying to access public paths, redirect to dashboard
    if (authToken) {
      console.log(
        'User authenticated on public path, redirecting to dashboard'
      );
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // For authenticated routes, check if user has token
  if (!authToken && !pathname.startsWith('/dashboard')) {
    // Don't need to check dashboard paths as they will be handled by the client
    return NextResponse.next();
  }

  // For dashboard routes without auth, redirect to login
  if (!authToken && pathname.startsWith('/dashboard')) {
    console.log('User not authenticated, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For all other routes, proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
