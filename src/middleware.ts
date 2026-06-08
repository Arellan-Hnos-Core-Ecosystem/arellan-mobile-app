import { jwtVerify, type JWTPayload } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/approvals", "/alerts", "/profile"];
const AUTH_PATH = "/login";
const ALLOWED_ROLES = new Set(["OWNER", "ADMIN"]);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "arellan-change-me-in-production"
);

interface ArellanJwtPayload extends JWTPayload {
  role?: string;
  sub?: string;
}

async function verifyToken(token: string): Promise<ArellanJwtPayload | null> {
  try {
    const { payload } = await jwtVerify<ArellanJwtPayload>(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest, from: string): NextResponse {
  const loginUrl = new URL(AUTH_PATH, request.url);
  loginUrl.searchParams.set("redirect", from);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("arellan-auth")?.value;

  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (isProtectedPath) {
    if (!token) return redirectToLogin(request, pathname);

    const payload = await verifyToken(token);

    if (!payload) return redirectToLogin(request, pathname);

    if (!payload.role || !ALLOWED_ROLES.has(payload.role)) {
      return redirectToLogin(request, pathname);
    }

    return NextResponse.next();
  }

  if (pathname === AUTH_PATH && token) {
    const payload = await verifyToken(token);
    if (payload?.role && ALLOWED_ROLES.has(payload.role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/approvals/:path*", "/alerts/:path*", "/profile/:path*", "/login"],
};
