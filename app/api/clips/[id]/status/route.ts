import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const clip = await prisma.clip.findUnique({
    where: { id },
    select: { status: true, progress: true, storageKey: true, error: true },
  });

  if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(clip);
}
