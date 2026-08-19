import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = 20;
  const search = searchParams.get("search") || "";

  const where = search
    ? { email: { contains: search } }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        subscription: true,
        _count: { select: { videos: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      kind: u.kind,
      createdAt: u.createdAt,
      videoCount: u._count.videos,
      plan: u.subscription?.plan || "free",
    })),
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
}
