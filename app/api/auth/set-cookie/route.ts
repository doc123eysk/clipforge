import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "No token" }, { status: 400 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
