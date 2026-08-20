import { SocialConnection } from "@prisma/client";

export interface PublishResult {
  ok: boolean;
  remoteUrl?: string;
  error?: string;
}

export async function publishToInstagram(
  clipStorageKey: string,
  connection: SocialConnection,
  caption: string = "Published via ClipForge",
  videoPublicUrl: string
): Promise<PublishResult> {
  const token = connection.token;
  if (!token) return { ok: false, error: "no_token" };
  if (!connection.remoteId) return { ok: false, error: "no_ig_user_id" };

  const igUserId = connection.remoteId;

  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "REELS",
        video_url: videoPublicUrl,
        caption,
        share_to_feed: true,
        access_token: token,
      }),
    }
  );

  const containerData = await containerRes.json();
  if (containerData.error) {
    console.error("[Instagram] Container error:", containerData.error);
    return { ok: false, error: containerData.error.message || "ig_container_failed" };
  }

  const containerId = containerData.id;

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(
      `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${token}`
    );
    const statusData = await statusRes.json();
    if (statusData.status_code === "FINISHED") break;
    if (statusData.status_code === "ERROR") {
      return { ok: false, error: "ig_processing_error" };
    }
  }

  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerId, access_token: token }),
    }
  );

  const publishData = await publishRes.json();
  if (publishData.error) {
    console.error("[Instagram] Publish error:", publishData.error);
    return { ok: false, error: publishData.error.message || "ig_publish_failed" };
  }

  return { ok: true, remoteUrl: `https://instagram.com/reel/${publishData.id}` };
}
