import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/approvals', '/alerts', '/profile']
const AUTH_PATH = '/login'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authCookie = request.cookies.get('arellan-auth')
  const hasToken = authCookie?.value === 'true'

  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  if (isProtectedPath && !hasToken) {
    console.log(`[Middleware] Bloqueado: ${pathname} — cookie ausente o invalida`)
    const loginUrl = new URL(AUTH_PATH, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname === AUTH_PATH && hasToken) {
    console.log(`[Middleware] Redirigiendo /login → /dashboard (ya autenticado)`)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/approvals/:path*', '/alerts/:path*', '/profile/:path*', '/login'],
}
