import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.id) {
    return NextResponse.json({ error: "not_auth" }, { status: 401 });
  }

  const settings = await getSettings();
  const { vkAppId, vkSecret } = settings.social;
  if (!vkAppId || !vkSecret) {
    return NextResponse.json({ error: "vk_not_configured" }, { status: 400 });
  }

  const body = await req.json();
  const { accessToken, userId, firstName, lastName, photo } = body;

  if (!accessToken || !userId) {
    return NextResponse.json({ error: "missing_data" }, { status: 400 });
  }

  try {
    await prisma.socialConnection.upsert({
      where: { userId_provider: { userId: user.id, provider: "vk" } },
      update: {
        status: "active",
        remoteId: String(userId),
        username: `${firstName || ""} ${lastName || ""}`.trim() || String(userId),
        token: accessToken,
      },
      create: {
        userId: user.id,
        provider: "vk",
        status: "active",
        remoteId: String(userId),
        username: `${firstName || ""} ${lastName || ""}`.trim() || String(userId),
        token: accessToken,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[VK] Save error:", err.message);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
