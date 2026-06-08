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

  const data = await nestRes.json() as {
    user?: { role?: string };
    tokens?: { accessToken: string; refreshToken: string; expiresIn?: number };
    mfaRequired?: boolean;
    mfaToken?: string;
    message?: string;
  };

  if (!nestRes.ok) {
    return NextResponse.json(data, { status: nestRes.status });
  }

  if (data.mfaRequired) {
    return NextResponse.json(data, { status: 200 });
  }

  if (!data.tokens?.accessToken || !data.user?.role) {
    return NextResponse.json({ message: "Respuesta de autenticacion invalida" }, { status: 502 });
  }

  if (!ALLOWED_ROLES.has(data.user.role)) {
    return NextResponse.json({ message: "Acceso no autorizado para este rol" }, { status: 403 });
  }

  const response = NextResponse.json(data, { status: 200 });
  response.cookies.set("arellan-auth", data.tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: data.tokens.expiresIn ?? 3600,
  });

  return response;
}
