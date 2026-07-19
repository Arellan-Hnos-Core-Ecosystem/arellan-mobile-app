import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.API_URL ?? "http://localhost:3001/api/v1";
const ALLOWED_ROLES = new Set(["OWNER", "ADMIN"]);

// FUN-13/FUN-20: este BFF es el NORMALIZADOR de contrato. El backend responde
// top-level ({ accessToken, refreshToken, user } o { mfaPending, sessionToken });
// el frontend móvil consume la forma anidada LoginResponse
// ({ mfaRequired, mfaToken, user, tokens }). Antes ambos lados asumían formas
// distintas y el estado del store nunca se autenticaba.
// SEC-04: el refreshToken NUNCA se devuelve al JS — se queda solo aquí (y el
// access token va también en cookie HttpOnly para el middleware).
export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;

  let nestRes: Response;
  try {
    nestRes = await fetch(`${NESTJS_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ message: "Error de conexion con el servidor" }, { status: 502 });
  }

  const data = await nestRes.json() as {
    user?: { role?: string };
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    tokens?: { accessToken?: string; refreshToken?: string; expiresIn?: number };
    mfaPending?: boolean;
    mfaRequired?: boolean;
    sessionToken?: string;
    mfaToken?: string;
    mfaEnrollmentRequired?: boolean;
    message?: string;
  };

  if (!nestRes.ok) {
    return NextResponse.json(data, { status: nestRes.status });
  }

  const mfaPending = data.mfaPending ?? data.mfaRequired;
  if (mfaPending) {
    return NextResponse.json(
      { mfaRequired: true, mfaToken: data.sessionToken ?? data.mfaToken },
      { status: 200 },
    );
  }

  const accessToken = data.accessToken ?? data.tokens?.accessToken;
  const role = data.user?.role;

  if (!accessToken || !role) {
    return NextResponse.json({ message: "Respuesta de autenticacion invalida" }, { status: 502 });
  }

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ message: "Acceso no autorizado para este rol" }, { status: 403 });
  }

  const maxAge = data.expiresIn ?? data.tokens?.expiresIn ?? 900;
  const response = NextResponse.json(
    {
      mfaRequired: false,
      user: data.user,
      tokens: { accessToken },
      mfaEnrollmentRequired: data.mfaEnrollmentRequired === true,
    },
    { status: 200 },
  );
  response.cookies.set("arellan-auth", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return response;
}
