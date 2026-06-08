import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.API_URL ?? "http://localhost:3001/api/v1";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("arellan-auth")?.value;

  if (token) {
    fetch(`${NESTJS_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("arellan-auth", "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
