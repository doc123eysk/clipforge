import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { readFile } from "fs/promises";
import { join } from "path";
import { stat } from "fs/promises";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.kind !== "admin" && video.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filePath = join(process.cwd(), "storage", "uploads", video.storageKey);
  try {
    const fileStat = await stat(filePath);
    const range = _req.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024 - 1, fileStat.size - 1);
      const chunkSize = end - start + 1;

      const buffer = Buffer.alloc(chunkSize);
      const { open } = await import("fs/promises");
      const fd = await open(filePath, "r");
      try {
        await fd.read(buffer, 0, chunkSize, start);
      } finally {
        await fd.close();
      }

      return new Response(buffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileStat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": "video/mp4",
        },
      });
    }

    const buffer = await readFile(filePath);

    return new Response(buffer, {
      headers: {
        "Content-Length": String(fileStat.size),
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
