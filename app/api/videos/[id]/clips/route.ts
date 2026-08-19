import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { join } from "path";
import { readFile } from "fs/promises";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { startSec, endSec } = await req.json();

  const video = await prisma.video.findFirst({ where: { id, userId: user.id } });
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.kind === "guest") {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentClipsCount = await prisma.clip.count({
      where: {
        video: { userId: user.id },
        createdAt: { gte: twentyFourHoursAgo },
      },
    });
    if (recentClipsCount >= 6) {
      return NextResponse.json({ error: "Лимит 6 отрезков в 24 часа для гостей" }, { status: 403 });
    }
  }

  const clip = await prisma.clip.create({
    data: {
      videoId: video.id,
      startSec,
      endSec,
      status: "pending",
    },
  });

  return NextResponse.json({ clip });
}
