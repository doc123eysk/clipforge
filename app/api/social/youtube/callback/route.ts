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
  const { youtubeClientId, youtubeClientSecret } = settings.social;
  if (!youtubeClientId || !youtubeClientSecret) {
    return NextResponse.redirect(new URL("/settings?error=youtube_not_configured", origin));
  }

  const redirectUri = `${origin}/api/social/youtube/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: youtubeClientId,
        client_secret: youtubeClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("[YouTube] Token error:", tokenData.error);
      return NextResponse.redirect(new URL("/settings?error=youtube_token_failed", origin));
    }

    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    await prisma.socialConnection.upsert({
      where: { userId_provider: { userId: user.id, provider: "youtube" } },
      update: {
        status: "active",
        remoteId: channel?.id || null,
        username: channel?.snippet?.title || "YouTube",
        token: tokenData.access_token,
        refresh: tokenData.refresh_token || null,
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
      },
      create: {
        userId: user.id,
        provider: "youtube",
        status: "active",
        remoteId: channel?.id || null,
        username: channel?.snippet?.title || "YouTube",
        token: tokenData.access_token,
        refresh: tokenData.refresh_token || null,
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
      },
    });

    return NextResponse.redirect(new URL("/settings?connected=youtube", origin));
  } catch (err: any) {
    console.error("[YouTube] Error:", err.message);
    return NextResponse.redirect(new URL("/settings?error=youtube_error", origin));
  }
}
