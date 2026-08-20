import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://clip-forge.ru";

  if (!user.id) {
    return NextResponse.redirect(new URL("/settings?error=not_auth", origin));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", origin));
  }

  const settings = await getSettings();
  const { tiktokClientId, tiktokClientSecret } = settings.social;
  if (!tiktokClientId || !tiktokClientSecret) {
    return NextResponse.redirect(new URL("/settings?error=tiktok_not_configured", origin));
  }

  const redirectUri = `${origin}/api/social/tiktok/callback`;

  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: tiktokClientId,
        client_secret: tiktokClientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("[TikTok] Token error:", tokenData.error);
      return NextResponse.redirect(new URL("/settings?error=tiktok_token_failed", origin));
    }

    const accessToken = tokenData.data?.access_token;
    const refreshToken = tokenData.data?.refresh_token;
    const expiresIn = tokenData.data?.expires_in;

    const userRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userRes.json();
    const profile = userData.data?.user;

    await prisma.socialConnection.upsert({
      where: { userId_provider: { userId: user.id, provider: "tiktok" } },
      update: {
        status: "active",
        remoteId: profile?.open_id || null,
        username: profile?.display_name || "TikTok",
        token: accessToken,
        refresh: refreshToken || null,
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      },
      create: {
        userId: user.id,
        provider: "tiktok",
        status: "active",
        remoteId: profile?.open_id || null,
        username: profile?.display_name || "TikTok",
        token: accessToken,
        refresh: refreshToken || null,
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      },
    });

    return NextResponse.redirect(new URL("/settings?connected=tiktok", origin));
  } catch (err: any) {
    console.error("[TikTok] Error:", err.message);
    return NextResponse.redirect(new URL("/settings?error=tiktok_error", origin));
  }
}
