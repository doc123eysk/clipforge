import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, totalVideos, totalClips, proUsers, guestUsers, registeredUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.video.count(),
      prisma.clip.count(),
      prisma.subscription.count({ where: { plan: "pro" } }),
      prisma.user.count({ where: { kind: "guest" } }),
      prisma.user.count({ where: { kind: "registered" } }),
    ]);

  const clipsByStatus = await prisma.clip.groupBy({
    by: ["status"],
    _count: true,
  });

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { _count: { select: { videos: true } } },
  });

  const recentVideos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: true, _count: { select: { clips: true } } },
  });

  const clips: Record<string, number> = {};
  clipsByStatus.forEach((c) => (clips[c.status] = c._count));

  return NextResponse.json({
    totalUsers,
    totalVideos,
    totalClips,
    proUsers,
    guestUsers,
    registeredUsers,
    clipsByStatus: clips,
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      email: u.email,
      kind: u.kind,
      createdAt: u.createdAt,
      videoCount: u._count.videos,
    })),
    recentVideos: recentVideos.map((v) => ({
      id: v.id,
      title: v.title,
      durationSec: v.durationSec,
      createdAt: v.createdAt,
      userEmail: v.user.email,
      clipCount: v._count.clips,
    })),
  });
}
