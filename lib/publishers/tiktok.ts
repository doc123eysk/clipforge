import { SocialConnection } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";

export interface PublishResult {
  ok: boolean;
  remoteUrl?: string;
  error?: string;
}

export async function publishToTikTok(
  clipStorageKey: string,
  connection: SocialConnection,
  title: string = "ClipForge"
): Promise<PublishResult> {
  const token = connection.token;
  if (!token) return { ok: false, error: "no_token" };

  const filePath = join(process.cwd(), "storage", "clips", clipStorageKey);
  const fileBuffer = await readFile(filePath);
  const fileBlob = new Blob([fileBuffer], { type: "video/mp4" });

  const initForm = new FormData();
  initForm.append("video", fileBlob, "clip.mp4");
  initForm.append("post_info.title", title);
  initForm.append("post_info.privacy_level", "PUBLIC_TO_EVERYONE");
  initForm.append("post_info.disable_duet", "0");
  initForm.append("post_info.disable_comment", "0");
  initForm.append("post_info.disable_stitch", "0");

  const initRes = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: initForm,
    }
  );

  const initData = await initRes.json();
  if (initData.error) {
    console.error("[TikTok] Init error:", initData.error);
    return { ok: false, error: initData.error.message || "tiktok_init_failed" };
  }

  const { publish_id, upload_url } = initData.data;
  if (upload_url) {
    const uploadRes = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: fileBuffer,
    });
    if (!uploadRes.ok) {
      console.error("[TikTok] Upload failed:", await uploadRes.text());
      return { ok: false, error: "tiktok_upload_failed" };
    }
  }

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(
      `https://open.tiktokapis.com/v2/post/publish/status/fetch/?publish_id=${publish_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const statusData = await statusRes.json();
    const status = statusData?.data?.status;
    if (status === "PUBLISH_COMPLETE") {
      return { ok: true, remoteUrl: `https://tiktok.com/@me/video/${publish_id}` };
    }
    if (status === "FAIL") {
      return { ok: false, error: "tiktok_publish_failed" };
    }
  }

  return { ok: false, error: "tiktok_timeout" };
}
