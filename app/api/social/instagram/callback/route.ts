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
  const { instagramClientId, instagramClientSecret } = settings.social;
  if (!instagramClientId || !instagramClientSecret) {
    return NextResponse.redirect(new URL("/settings?error=instagram_not_configured", origin));
  }

  const redirectUri = `${origin}/api/social/instagram/callback`;

  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${instagramClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${instagramClientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error("[Instagram] Short-lived token error:", tokenData.error);
      return NextResponse.redirect(new URL("/settings?error=instagram_token_failed", origin));
    }

    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${instagramClientId}&client_secret=${instagramClientSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longData = await longRes.json();
    const longToken = longData.access_token || tokenData.access_token;

    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`
    );
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];

    if (!page) {
      return NextResponse.redirect(new URL("/settings?error=instagram_no_page", origin));
    }

    const pageToken = page.access_token;
    const igRes = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${pageToken}`
    );
    const igData = await igRes.json();
    const igAccount = igData.instagram_business_account;

    if (!igAccount) {
      return NextResponse.redirect(new URL("/settings?error=instagram_no_ig_account", origin));
    }

    await prisma.socialConnection.upsert({
      where: { userId_provider: { userId: user.id, provider: "instagram" } },
      update: {
        status: "active",
        remoteId: igAccount.id,
        username: igAccount.name || "Instagram",
        token: pageToken,
        refresh: longToken,
      },
      create: {
        userId: user.id,
        provider: "instagram",
        status: "active",
        remoteId: igAccount.id,
        username: igAccount.name || "Instagram",
        token: pageToken,
        refresh: longToken,
      },
    });

    return NextResponse.redirect(new URL("/settings?connected=instagram", origin));
  } catch (err: any) {
    console.error("[Instagram] Error:", err.message);
    return NextResponse.redirect(new URL("/settings?error=instagram_error", origin));
  }
}
