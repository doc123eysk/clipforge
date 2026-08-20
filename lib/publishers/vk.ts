import { SocialConnection } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";

export interface PublishResult {
  ok: boolean;
  remoteUrl?: string;
  error?: string;
}

export async function publishToVK(
  clipStorageKey: string,
  connection: SocialConnection,
  type: "video" | "clip" = "video"
): Promise<PublishResult> {
  const token = connection.token;
  if (!token) return { ok: false, error: "no_token" };

  const filePath = join(process.cwd(), "storage", "clips", clipStorageKey);
  const fileBuffer = await readFile(filePath);
  const fileBlob = new Blob([fileBuffer], { type: "video/mp4" });

  if (type === "clip") {
    const saveRes = await fetch(
      `https://api.vk.com/method/shortVideo.create?access_token=${token}&file_size=${fileBuffer.length}&description=ClipForge&v=5.199`
    );
    const saveData = await saveRes.json();

    if (saveData.error) {
      console.error("[VK] shortVideo.create error:", saveData.error);
      return { ok: false, error: saveData.error.error_msg || "vk_clip_create_failed" };
    }

    const { upload_url } = saveData.response;
    const formData = new FormData();
    formData.append("video_file", fileBlob, "clip.mp4");

    const uploadRes = await fetch(upload_url, { method: "POST", body: formData });
    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      console.error("[VK] Clip upload failed:", text);
      return { ok: false, error: "vk_clip_upload_failed" };
    }

    return { ok: true, remoteUrl: "pending" };
  }

  const saveRes = await fetch(
    `https://api.vk.com/method/video.save?access_token=${token}&v=5.199`
  );
  const saveData = await saveRes.json();

  if (saveData.error) {
    console.error("[VK] video.save error:", saveData.error);
    return { ok: false, error: saveData.error.error_msg || "vk_save_failed" };
  }

  const { upload_url, video_id, owner_id } = saveData.response;
  const formData = new FormData();
  formData.append("video_file", fileBlob, "clip.mp4");

  const uploadRes = await fetch(upload_url, { method: "POST", body: formData });
  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    console.error("[VK] Upload failed:", text);
    return { ok: false, error: "vk_upload_failed" };
  }

  return { ok: true, remoteUrl: `https://vk.com/video${owner_id}_${video_id}` };
}
