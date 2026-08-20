import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { publishClip } from "@/lib/publishers";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user.id) {
    return NextResponse.json({ error: "not_auth" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { provider = "vk", scheduledAt, type = "video" } = body;

  const clip = await prisma.clip.findUnique({ where: { id } });
  if (!clip || clip.status !== "ready" || !clip.storageKey) {
    return NextResponse.json({ error: "clip_not_ready" }, { status: 400 });
  }

  const connection = await prisma.socialConnection.findUnique({
    where: { userId_provider: { userId: user.id, provider } },
  });
  if (!connection || connection.status !== "active" || !connection.token) {
    return NextResponse.json({ error: `${provider}_not_connected` }, { status: 400 });
  }

  if (scheduledAt) {
    const scheduleDate = new Date(scheduledAt);
    if (scheduleDate <= new Date()) {
      return NextResponse.json({ error: "scheduled_at_must_be_future" }, { status: 400 });
    }

    const publication = await prisma.publication.create({
      data: {
        clipId: clip.id,
        userId: user.id,
        provider,
        status: "scheduled",
        scheduledAt: scheduleDate,
      },
    });

    return NextResponse.json({ ok: true, publicationId: publication.id, scheduledAt });
  }

  try {
    let videoPublicUrl: string | undefined;
    if (provider === "instagram") {
      videoPublicUrl = `https://clip-forge.ru/api/clips/${clip.id}/preview`;
    }

    const result = await publishClip(clip.id, provider, connection, {
      type: provider === "vk" ? type : undefined,
      videoPublicUrl,
    });

    if (result.ok) {
      await prisma.publication.create({
        data: {
          clipId: clip.id,
          userId: user.id,
          provider,
          status: "published",
          remoteUrl: result.remoteUrl || null,
          publishedAt: new Date(),
        },
      });
      return NextResponse.json({ ok: true, url: result.remoteUrl });
    }

    return NextResponse.json({ error: result.error || "publish_failed" }, { status: 500 });
  } catch (err: any) {
    console.error("[Publish] Error:", err.message);
    return NextResponse.json({ error: "publish_failed" }, { status: 500 });
  }
}
