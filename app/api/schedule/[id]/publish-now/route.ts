import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user.id) {
    return NextResponse.json({ error: "not_auth" }, { status: 401 });
  }

  const { id } = await params;
  const pub = await prisma.publication.findUnique({ where: { id } });
  if (!pub || pub.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (pub.status !== "scheduled") {
    return NextResponse.json({ error: "not_scheduled" }, { status: 400 });
  }

  await prisma.publication.update({
    where: { id },
    data: { status: "pending", scheduledAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
