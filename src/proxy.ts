import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasValidSessionToken } from '@/lib/session-token';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('shared-costs-session')?.value;
  const authenticated = await hasValidSessionToken(token);
  const isLoginRoute = pathname === '/login';

  if (!authenticated && !isLoginRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authenticated && isLoginRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
