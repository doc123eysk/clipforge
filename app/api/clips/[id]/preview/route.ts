import { prisma } from "@/lib/prisma";
import { join } from "path";
import { readFile } from "fs/promises";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clip = await prisma.clip.findUnique({ where: { id } });
  if (!clip || clip.status !== "ready" || !clip.storageKey) {
    return new Response("Not ready", { status: 404 });
  }

  const filePath = join(process.cwd(), "storage", "clips", clip.storageKey);
  try {
    const buffer = await readFile(filePath);
    return new Response(buffer, {
      headers: {
        "Content-Length": String(buffer.length),
        "Content-Type": "video/mp4",
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}
