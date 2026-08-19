import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider, scheduledAt } = await req.json();

  const clip = await prisma.clip.findUnique({ where: { id } });
  if (!clip || !clip.storageKey) return NextResponse.json({ error: "Clip not ready" }, { status: 400 });

  const pub = await prisma.publication.create({
    data: {
      clipId: clip.id,
      provider,
      status: scheduledAt ? "scheduled" : "pending",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  if (!scheduledAt) {
    console.log(`[PUBLISH] Queuing clip ${clip.id} to ${provider}`);
  }

  return NextResponse.json({ publication: pub });
}
