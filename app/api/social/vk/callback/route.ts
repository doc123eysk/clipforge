import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const user = await getCurrentUser();

  if (!user.id) {
    return NextResponse.redirect(new URL("/settings?error=not_auth", req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", req.url));
  }

  const settings = await getSettings();
  const { vkAppId, vkSecret } = settings.social;

  if (!vkAppId || !vkSecret) {
    return NextResponse.redirect(new URL("/settings?error=vk_not_configured", req.url));
  }

  const redirectUri = `${new URL(req.url).origin}/api/social/vk/callback`;

  try {
    const tokenRes = await fetch(
      `https://oauth.vk.com/access_token?client_id=${vkAppId}&client_secret=${vkSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("[VK] Token error:", tokenData.error_description);
      return NextResponse.redirect(new URL("/settings?error=vk_token_failed", req.url));
    }

    const accessToken = tokenData.access_token;
    const vkUserId = tokenData.user_id;

    const profileRes = await fetch(
      `https://api.vk.com/method/users.get?user_ids=${vkUserId}&fields=photo_50&access_token=${accessToken}&v=5.199`
    );
    const profileData = await profileRes.json();
    const profile = profileData.response?.[0];

    await prisma.socialConnection.upsert({
      where: { userId_provider: { userId: user.id, provider: "vk" } },
      update: {
        status: "active",
        remoteId: String(vkUserId),
        username: profile ? `${profile.first_name} ${profile.last_name}` : String(vkUserId),
        token: accessToken,
      },
      create: {
        userId: user.id,
        provider: "vk",
        status: "active",
        remoteId: String(vkUserId),
        username: profile ? `${profile.first_name} ${profile.last_name}` : String(vkUserId),
        token: accessToken,
      },
    });

    return NextResponse.redirect(new URL("/settings?connected=vk", req.url));
  } catch (err: any) {
    console.error("[VK] Error:", err.message);
    return NextResponse.redirect(new URL("/settings?error=vk_error", req.url));
  }
}
