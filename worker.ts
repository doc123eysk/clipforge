import { prisma } from "./lib/prisma";
import { clipVideo } from "./lib/ffmpeg";
import { join } from "path";
import { mkdir } from "fs/promises";

const POLL_INTERVAL = 3000;

async function processClip(clip: { id: string; videoId: string; startSec: number; endSec: number; watermarked: boolean }) {
  const video = await prisma.video.findUnique({ where: { id: clip.videoId } });
  if (!video) {
    await prisma.clip.update({ where: { id: clip.id }, data: { status: "error", error: "Video not found" } });
    return;
  }

  const inputPath = join(process.cwd(), "storage", "uploads", video.storageKey);
  const outputDir = join(process.cwd(), "storage", "clips");
  await mkdir(outputDir, { recursive: true });
  const outputPath = join(outputDir, `${clip.id}.mp4`);

  try {
    await prisma.clip.update({ where: { id: clip.id }, data: { status: "processing", progress: 10 } });

    await clipVideo(inputPath, outputPath, clip.startSec, clip.endSec, clip.watermarked);

    const stat = await import("fs").then((fs) => fs.statSync(outputPath));

    await prisma.clip.update({
      where: { id: clip.id },
      data: {
        status: "ready",
        progress: 100,
        storageKey: `${clip.id}.mp4`,
        sizeBytes: stat.size,
      },
    });

    console.log(`[WORKER] Clip ${clip.id} ready (${stat.size} bytes)`);
  } catch (err: any) {
    await prisma.clip.update({
      where: { id: clip.id },
      data: { status: "error", error: err.message || "Processing failed" },
    });
    console.error(`[WORKER] Clip ${clip.id} failed:`, err.message);
  }
}

async function pollPendingClips() {
  const clips = await prisma.clip.findMany({
    where: { status: { in: ["pending"] } },
    take: 3,
  });

  for (const clip of clips) {
    await processClip(clip);
  }
}

async function pollScheduledPublications() {
  const pubs = await prisma.publication.findMany({
    where: { status: "scheduled", scheduledAt: { lte: new Date() } },
    take: 5,
  });

  for (const pub of pubs) {
    await prisma.publication.update({ where: { id: pub.id }, data: { status: "pending" } });
    console.log(`[WORKER] Scheduled publication ${pub.id} moved to pending`);
  }
}

async function main() {
  console.log("[WORKER] ClipForge worker started");
  while (true) {
    try {
      await pollPendingClips();
      await pollScheduledPublications();
    } catch (err: any) {
      console.error("[WORKER] Error:", err.message);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
}

main();
