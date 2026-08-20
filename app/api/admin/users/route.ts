import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const search = url.searchParams.get("search") || "";
  const take = 20;
  const skip = (page - 1) * take;

  const where = search ? { email: { contains: search } } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { subscription: true, _count: { select: { videos: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      kind: u.kind,
      plan: u.subscription?.plan || "free",
      createdAt: u.createdAt,
      videoCount: u._count.videos,
    })),
    total,
    pages: Math.ceil(total / take),
  });
}
