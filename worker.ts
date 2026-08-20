import { prisma } from "@/lib/prisma";
import { clipVideo } from "@/lib/ffmpeg";
import { publishClip } from "@/lib/publishers";
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

async function pollPendingPublications() {
  const pubs = await prisma.publication.findMany({
    where: { status: "pending", retryCount: { lt: 3 } },
    take: 3,
  });

  for (const pub of pubs) {
    await prisma.publication.update({ where: { id: pub.id }, data: { status: "processing" } });

    try {
      const connection = await prisma.socialConnection.findUnique({
        where: { userId_provider: { userId: pub.userId, provider: pub.provider } },
      });

      if (!connection || connection.status !== "active" || !connection.token) {
        await prisma.publication.update({
          where: { id: pub.id },
          data: { status: "error", error: "social_not_connected", retryCount: 3 },
        });
        continue;
      }

      let videoPublicUrl: string | undefined;
      if (pub.provider === "instagram") {
        const clip = await prisma.clip.findUnique({ where: { id: pub.clipId } });
        if (clip?.storageKey) {
          const settingsRes = await fetch("http://localhost:3000/api/admin/settings");
          const settings = await settingsRes.json();
          const publicUrl = settings.s3?.publicUrl;
          if (publicUrl) {
            videoPublicUrl = `${publicUrl}/api/clips/${pub.clipId}/preview`;
          } else {
            videoPublicUrl = `https://clip-forge.ru/api/clips/${pub.clipId}/preview`;
          }
        }
      }

      const result = await publishClip(pub.clipId, pub.provider, connection, {
        type: pub.provider === "vk" ? "video" : undefined,
        videoPublicUrl,
      });

      if (result.ok) {
        await prisma.publication.update({
          where: { id: pub.id },
          data: { status: "published", remoteUrl: result.remoteUrl || null, publishedAt: new Date() },
        });
        console.log(`[WORKER] Publication ${pub.id} published to ${pub.provider}`);
      } else {
        await prisma.publication.update({
          where: { id: pub.id },
          data: { status: "error", error: result.error || "unknown", retryCount: pub.retryCount + 1 },
        });
        console.error(`[WORKER] Publication ${pub.id} failed: ${result.error}`);
      }
    } catch (err: any) {
      await prisma.publication.update({
        where: { id: pub.id },
        data: { status: "error", error: err.message, retryCount: pub.retryCount + 1 },
      });
      console.error(`[WORKER] Publication ${pub.id} error:`, err.message);
    }
  }
}

async function main() {
  console.log("[WORKER] Started");
  while (true) {
    try { await pollClips(); } catch {}
    try { await pollPublications(); } catch {}
    try { await pollPendingPublications(); } catch {}
    await new Promise((r) => setTimeout(r, POLL));
  }
}

main();
