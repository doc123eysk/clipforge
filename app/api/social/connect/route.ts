import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const REDIRECT_URLS: Record<string, string> = {
  youtube: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/social/callback?provider=youtube`,
  vk: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/social/callback?provider=vk`,
  tiktok: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/social/callback?provider=tiktok`,
  instagram: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/social/callback?provider=instagram`,
};

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  if (!provider || !REDIRECT_URLS[provider]) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const authUrls: Record<string, string> = {
    youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.YOUTUBE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URLS.youtube)}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload+https://www.googleapis.com/auth/youtube&access_type=offline`,
    vk: `https://oauth.vk.com/authorize?client_id=${process.env.VK_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URLS.vk)}&response_type=code&v=5.131`,
    tiktok: `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URLS.tiktok)}&response_type=code&scope=user.info.basic,video.publish,video.upload`,
    instagram: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.VK_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URLS.instagram)}&scope=instagram_basic,instagram_content_publish,pages_show_list`,
  };

  return NextResponse.json({ url: authUrls[provider] });
}
