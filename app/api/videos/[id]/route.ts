import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const video = await prisma.video.findUnique({
    where: { id },
    include: { clips: { orderBy: { createdAt: "desc" } } },
  });

  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.kind !== "admin" && video.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(video);
}
