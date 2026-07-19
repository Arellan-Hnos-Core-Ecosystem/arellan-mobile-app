import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.API_URL ?? "http://localhost:3001/api/v1";
const ALLOWED_ROLES = new Set(["OWNER", "ADMIN"]);

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

  // FUN-13: el backend NestJS devuelve el token en el nivel superior
  // ({ accessToken, refreshToken, user }) y el flag de MFA como `mfaPending`
  // ({ mfaPending, sessionToken }). El extractor anterior leía
  // `tokens.accessToken`/`mfaRequired` (estructura inexistente) → 502 en cada
  // login. Se lee de forma defensiva bajo ambas estructuras.
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
    message?: string;
  };

  if (!nestRes.ok) {
    return NextResponse.json(data, { status: nestRes.status });
  }

  const mfaPending = data.mfaPending ?? data.mfaRequired;
  if (mfaPending) {
    return NextResponse.json(data, { status: 200 });
  }

  const accessToken = data.accessToken ?? data.tokens?.accessToken;
  const role = data.user?.role;

  if (!accessToken || !role) {
    return NextResponse.json({ message: "Respuesta de autenticacion invalida" }, { status: 502 });
  }

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ message: "Acceso no autorizado para este rol" }, { status: 403 });
  }

  const maxAge = data.expiresIn ?? data.tokens?.expiresIn ?? 3600;
  const response = NextResponse.json(data, { status: 200 });
  response.cookies.set("arellan-auth", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return response;
}
