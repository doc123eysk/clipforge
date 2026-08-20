import { prisma } from "@/lib/prisma";
import { join } from "path";
import { stat } from "fs/promises";
import { createReadStream } from "fs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clip = await prisma.clip.findUnique({ where: { id } });
  if (!clip || clip.status !== "ready" || !clip.storageKey) {
    return new Response("Not ready", { status: 404 });
  }

  const filePath = join(process.cwd(), "storage", "clips", clip.storageKey);
  try {
    const fileStat = await stat(filePath);
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
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}
