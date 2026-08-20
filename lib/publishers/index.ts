import { prisma } from "@/lib/prisma";
import { SocialConnection } from "@prisma/client";
import { publishToVK, PublishResult } from "./vk";
import { publishToYouTube } from "./youtube";
import { publishToTikTok } from "./tiktok";
import { publishToInstagram } from "./instagram";

export type { PublishResult };

export async function publishClip(
  clipId: string,
  provider: string,
  connection: SocialConnection,
  options: { type?: string; title?: string; videoPublicUrl?: string } = {}
): Promise<PublishResult> {
  const clip = await prisma.clip.findUnique({ where: { id: clipId } });
  if (!clip || !clip.storageKey) {
    return { ok: false, error: "clip_not_ready" };
  }

  switch (provider) {
    case "vk":
      return publishToVK(clip.storageKey, connection, (options.type as "video" | "clip") || "video");
    case "youtube":
      return publishToYouTube(clip.storageKey, connection, options.title);
    case "tiktok":
      return publishToTikTok(clip.storageKey, connection, options.title);
    case "instagram":
      if (!options.videoPublicUrl) return { ok: false, error: "no_public_url" };
      return publishToInstagram(clip.storageKey, connection, options.title, options.videoPublicUrl);
    default:
      return { ok: false, error: "unknown_provider" };
  }
}
