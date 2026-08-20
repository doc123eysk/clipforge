import { prisma } from "@/lib/prisma";
import { clipVideo } from "@/lib/ffmpeg";
import { join } from "path";
import { mkdir, stat } from "fs/promises";

const POLL = 3000;

async function processClip(clip: { id: string; videoId: string; startSec: number; endSec: number; watermarked: boolean }) {
  const video = await prisma.video.findUnique({ where: { id: clip.videoId } });
  if (!video) return;

  const input = join(process.cwd(), "storage", "uploads", video.storageKey);
  const outputDir = join(process.cwd(), "storage", "clips");
  await mkdir(outputDir, { recursive: true });
  const output = join(outputDir, `${clip.id}.mp4`);

  await prisma.clip.update({ where: { id: clip.id }, data: { status: "processing", progress: 10 } });

  try {
    await clipVideo(input, output, clip.startSec, clip.endSec, clip.watermarked);
    const fileStat = await stat(output);
    await prisma.clip.update({
      where: { id: clip.id },
      data: { status: "ready", progress: 100, storageKey: `${clip.id}.mp4`, sizeBytes: fileStat.size },
    });
    console.log(`[WORKER] Clip ${clip.id} ready`);
  } catch (err: any) {
    await prisma.clip.update({ where: { id: clip.id }, data: { status: "error", error: err.message } });
    console.error(`[WORKER] Clip ${clip.id} error:`, err.message);
  }
}

async function pollClips() {
  const clips = await prisma.clip.findMany({ where: { status: "pending" }, take: 3 });
  await Promise.all(clips.map(processClip));
}

async function pollPublications() {
  const pubs = await prisma.publication.findMany({
    where: { status: "scheduled", scheduledAt: { lte: new Date() } },
    take: 5,
  });
  for (const p of pubs) {
    await prisma.publication.update({ where: { id: p.id }, data: { status: "pending" } });
  }
}

async function main() {
  console.log("[WORKER] Started");
  while (true) {
    try { await pollClips(); } catch {}
    try { await pollPublications(); } catch {}
    await new Promise((r) => setTimeout(r, POLL));
  }
}

main();
