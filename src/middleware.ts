import { jwtVerify, type JWTPayload } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/approvals", "/alerts", "/profile"];
const AUTH_PATH = "/login";
const ALLOWED_ROLES = new Set(["OWNER", "ADMIN"]);

// SEC-17: el backend NestJS firma con `JWT_ACCESS_SECRET` (HS256). Antes se
// usaba `JWT_SECRET` (nombre distinto) con fallback embebido predecible, lo que
// rompía la validación o forzaba un secreto adivinable. Se alinea el nombre y se
// elimina el fallback: sin secreto configurado se falla en cerrado (deniega).
// (Recomendación de fondo: migrar el backend a RS256 y verificar aquí con la
// clave pública, evitando compartir el secreto de firma con el frontend.)
const JWT_SECRET_RAW = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
const JWT_SECRET = JWT_SECRET_RAW
  ? new TextEncoder().encode(JWT_SECRET_RAW)
  : null;

interface ArellanJwtPayload extends JWTPayload {
  role?: string;
  sub?: string;
}

async function verifyToken(token: string): Promise<ArellanJwtPayload | null> {
  if (!JWT_SECRET) {
    console.error("[middleware] JWT_ACCESS_SECRET no configurado — se deniega el acceso protegido.");
    return null;
  }
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
