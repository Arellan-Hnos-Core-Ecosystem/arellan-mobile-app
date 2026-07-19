import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.API_URL ?? "http://localhost:3001/api/v1";
const ALLOWED_ROLES = new Set(["OWNER", "ADMIN"]);

// FUN-20: antes el store posteaba { mfaToken, code } al proxy de /auth/login —
// contrato imposible (el backend espera { sessionToken, token } en
// /auth/mfa/verify). Esta ruta proxya el verify real y normaliza la respuesta
// a la forma MFAVerifyResponse ({ user, tokens }). SEC-04: sin refreshToken en
// el body; access token también en cookie HttpOnly para el middleware.
export async function POST(request: NextRequest) {
  const body = await request.json() as { mfaToken?: string; code?: string };

  if (!body.mfaToken || !body.code) {
    return NextResponse.json({ message: "mfaToken y code son requeridos" }, { status: 400 });
  }

  let nestRes: Response;
  try {
    nestRes = await fetch(`${NESTJS_URL}/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: body.mfaToken, token: body.code }),
    });
  } catch {
    return NextResponse.json({ message: "Error de conexion con el servidor" }, { status: 502 });
  }

  const data = await nestRes.json() as {
    user?: { role?: string };
    accessToken?: string;
    expiresIn?: number;
    message?: string;
  };

  if (!nestRes.ok) {
    return NextResponse.json(data, { status: nestRes.status });
  }

  const role = data.user?.role;
  if (!data.accessToken || !role) {
    return NextResponse.json({ message: "Respuesta de autenticacion invalida" }, { status: 502 });
  }
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ message: "Acceso no autorizado para este rol" }, { status: 403 });
  }

  const response = NextResponse.json(
    { user: data.user, tokens: { accessToken: data.accessToken } },
    { status: 200 },
  );
  response.cookies.set("arellan-auth", data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: data.expiresIn ?? 900,
  });

  return response;
}
