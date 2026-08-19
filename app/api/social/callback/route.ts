import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user.id) {
    return NextResponse.redirect(new URL("/settings", req.url));
  }

  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  const code = url.searchParams.get("code");

  if (!provider || !code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", req.url));
  }

  try {
    await prisma.socialConnection.upsert({
      where: { userId_provider: { userId: user.id, provider } },
      update: { status: "active", token: code },
      create: { userId: user.id, provider, status: "active", token: code },
    });
  } catch (err) {
    console.error(`[SOCIAL] Callback error for ${provider}:`, err);
  }

  return NextResponse.redirect(new URL("/settings?connected=" + provider, req.url));
}
