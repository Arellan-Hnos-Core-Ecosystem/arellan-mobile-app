import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/approvals', '/alerts', '/profile']
const AUTH_PATH = '/login'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasToken = request.cookies.has('arellan-auth')

  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  if (isProtectedPath && !hasToken) {
    const loginUrl = new URL(AUTH_PATH, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname === AUTH_PATH && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/approvals/:path*', '/alerts/:path*', '/profile/:path*', '/login'],
}
