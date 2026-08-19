import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { join } from "path";
import { readFile, stat } from "fs/promises";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const video = await prisma.video.findFirst({ where: { id, userId: user.id } });
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filePath = join(process.cwd(), "storage", "uploads", video.storageKey);
  try {
    const fileStat = await stat(filePath);
    const buffer = await readFile(filePath);

    return new Response(buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(fileStat.size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }
}
