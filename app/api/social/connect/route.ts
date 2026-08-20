import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const settings = await getSettings();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://clip-forge.ru";

  if (provider === "vk") {
    if (!settings.social.vkEnabled || !settings.social.vkAppId) {
      return NextResponse.redirect(new URL("/settings?error=vk_not_configured", origin));
    }
    const redirectUri = `${origin}/api/social/vk/callback`;
    const vkUrl = `https://oauth.vk.com/authorize?client_id=${settings.social.vkAppId}&display=page&redirect_uri=${encodeURIComponent(redirectUri)}&scope=wall,video&response_type=code&v=5.199`;
    return NextResponse.redirect(vkUrl);
  }

  if (provider === "youtube") {
    if (!settings.social.youtubeEnabled || !settings.social.youtubeClientId) {
      return NextResponse.redirect(new URL("/settings?error=youtube_not_configured", origin));
    }
    const redirectUri = `${origin}/api/social/youtube/callback`;
    const url = `https://accounts.google.com/o/oauth2/auth?client_id=${settings.social.youtubeClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload&access_type=offline&prompt=consent`;
    return NextResponse.redirect(url);
  }

  if (provider === "tiktok") {
    if (!settings.social.tiktokEnabled || !settings.social.tiktokClientId) {
      return NextResponse.redirect(new URL("/settings?error=tiktok_not_configured", origin));
    }
    const redirectUri = `${origin}/api/social/tiktok/callback`;
    const state = crypto.randomUUID();
    const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${settings.social.tiktokClientId}&response_type=code&scope=video.upload&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    return NextResponse.redirect(url);
  }

  if (provider === "instagram") {
    if (!settings.social.instagramEnabled || !settings.social.instagramClientId) {
      return NextResponse.redirect(new URL("/settings?error=instagram_not_configured", origin));
    }
    const redirectUri = `${origin}/api/social/instagram/callback`;
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${settings.social.instagramClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&response_type=code`;
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL("/settings?error=unknown_provider", origin));
}
