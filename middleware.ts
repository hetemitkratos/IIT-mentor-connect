import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

// Paths that must never trigger a redirect even if unauthenticated
// Prevents infinite redirect loop if these paths are ever added to the matcher
const PUBLIC_PATHS = ['/', '/mentors']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip auth check for public paths — safety guard against infinite redirects
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    // Log unauthorized access attempt for debugging
    console.warn('[middleware] Unauthorized access attempt:', pathname)
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Authenticated — no role logic here; role checks happen server-side in route handlers
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bookings/:path*',
    '/book/:path*',
    '/mentor/:path*',
    '/admin/:path*',
    '/apply/:path*',
  ],
}
