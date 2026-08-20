import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clip = await prisma.clip.findUnique({ where: { id }, include: { video: true } });
  if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (clip.video.userId !== user.id && user.kind !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await _req.json();
  const { provider, scheduledAt } = body;

  const publication = await prisma.publication.create({
    data: {
      clipId: id,
      provider,
      status: scheduledAt ? "scheduled" : "pending",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  return NextResponse.json({ ok: true, publication });
}
