import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const settings = await getSettings();

  if (provider === "vk") {
    if (!settings.social.vkEnabled || !settings.social.vkAppId) {
      return NextResponse.redirect(new URL("/settings?error=vk_not_configured", req.url));
    }
    const redirectUri = `${new URL(req.url).origin}/api/social/vk/callback`;
    const vkUrl = `https://oauth.vk.com/authorize?client_id=${settings.social.vkAppId}&display=page&redirect_uri=${encodeURIComponent(redirectUri)}&scope=wall,video,offline&response_type=code&v=5.199`;
    return NextResponse.redirect(vkUrl);
  }

  return NextResponse.redirect(new URL("/settings?error=unknown_provider", req.url));
}
