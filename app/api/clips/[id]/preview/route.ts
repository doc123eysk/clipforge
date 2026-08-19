import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { join } from "path";
import { readFile, stat } from "fs/promises";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const clip = await prisma.clip.findUnique({ where: { id } });
  if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (clip.status === "ready" && clip.storageKey) {
    const filePath = join(process.cwd(), "storage", "clips", clip.storageKey);
    try {
      const fileStat = await stat(filePath);
      const buffer = await readFile(filePath);
      return new Response(buffer, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(fileStat.size),
          "Accept-Ranges": "bytes",
        },
      });
    } catch {
      return NextResponse.json({ error: "File missing" }, { status: 404 });
    }
  }

  return NextResponse.json({ status: clip.status, progress: clip.progress });
}
