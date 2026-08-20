import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { join } from "path";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (user.kind === "guest" && !user.id) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (video.userId !== user.id && user.kind !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await _req.json();
  const { startSec, endSec, watermarked } = body;

  if (startSec == null || endSec == null || startSec >= endSec) {
    return NextResponse.json({ error: "Неверные границы клипа" }, { status: 400 });
  }

  const settings = await getSettings();
  const isPro = user.subscription?.plan === "pro";
  const maxClipDur = isPro ? settings.limits.maxClipDuration * 3 : settings.limits.maxClipDuration;
  if (endSec - startSec > maxClipDur) {
    return NextResponse.json({ error: `Макс. длительность клипа ${maxClipDur} сек` }, { status: 400 });
  }

  if (user.kind === "guest") {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await prisma.clip.count({
      where: { video: { userId: user.id }, createdAt: { gte: since } },
    });
    if (count >= settings.limits.guestDailyLimit) {
      return NextResponse.json({ error: `Лимит ${settings.limits.guestDailyLimit} клипов в день` }, { status: 403 });
    }
  }

  const maxClips = isPro ? settings.limits.maxClipsPerVideoPro : settings.limits.maxClipsPerVideoFree;
  const clipCount = await prisma.clip.count({ where: { videoId: id } });
  if (clipCount >= maxClips) {
    return NextResponse.json({ error: `Макс. ${maxClips} клипов на видео` }, { status: 400 });
  }

  const clip = await prisma.clip.create({
    data: {
      videoId: id,
      startSec,
      endSec,
      watermarked: watermarked ?? (user.kind === "guest"),
    },
  });

  return NextResponse.json({ ok: true, clip });
}
