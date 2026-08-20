import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user.id) {
    return NextResponse.json({ error: "not_auth" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = { userId: user.id };
  if (provider) where.provider = provider;
  if (from || to) {
    where.scheduledAt = {};
    if (from) where.scheduledAt.gte = new Date(from);
    if (to) where.scheduledAt.lte = new Date(to);
  }

  const publications = await prisma.publication.findMany({
    where,
    include: {
      clip: {
        include: { video: { select: { title: true } } },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: 100,
  });

  return NextResponse.json({ publications });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user.id) {
    return NextResponse.json({ error: "not_auth" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const pub = await prisma.publication.findUnique({ where: { id } });
  if (!pub || pub.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (pub.status !== "scheduled" && pub.status !== "error") {
    return NextResponse.json({ error: "cannot_delete" }, { status: 400 });
  }

  await prisma.publication.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
