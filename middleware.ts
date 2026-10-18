import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/', '/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api/auth') || pathname.startsWith('/api/health') || publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    const session = request.cookies.get('neo_session')?.value;
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
