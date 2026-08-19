import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [totalUsers, totalVideos, totalClips, proUsers, guestUsers] = await Promise.all([
    prisma.user.count(),
    prisma.video.count(),
    prisma.clip.count(),
    prisma.user.count({ where: { subscription: { plan: "pro" } } }),
    prisma.user.count({ where: { kind: "guest" } }),
  ]);

  const clipsByStatus = await prisma.clip.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { _count: { select: { videos: true } } },
  });

  const recentVideos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { email: true, kind: true } }, _count: { select: { clips: true } } },
  });

  return NextResponse.json({
    stats: {
      totalUsers,
      totalVideos,
      totalClips,
      proUsers,
      guestUsers,
      registeredUsers: totalUsers - guestUsers,
      clipsByStatus: Object.fromEntries(clipsByStatus.map((c) => [c.status, c._count.id])),
    },
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
      userKind: v.user.kind,
      clipCount: v._count.clips,
    })),
  });
}
