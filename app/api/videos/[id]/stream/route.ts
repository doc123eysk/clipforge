import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createReadStream } from "fs";
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
      const [start, end] = range.replace(/bytes=/, "").split("-").map(Number);
      const chunkSize = end - start + 1;
      const stream = createReadStream(filePath, { start, end });

      const reader = stream as any;
      const webStream = new ReadableStream({
        start(controller) {
          reader.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
          reader.on("end", () => controller.close());
          reader.on("error", (err: Error) => controller.error(err));
        },
      });

      return new Response(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileStat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": "video/mp4",
        },
      });
    }

    const webStream = new ReadableStream({
      start(controller) {
        const stream = createReadStream(filePath);
        const reader = stream as any;
        reader.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        reader.on("end", () => controller.close());
        reader.on("error", (err: Error) => controller.error(err));
      },
    });

    return new Response(webStream, {
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
