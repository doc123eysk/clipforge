import { SocialConnection } from "@prisma/client";
import { readFile } from "fs/promises";
import { join } from "path";

export interface PublishResult {
  ok: boolean;
  remoteUrl?: string;
  error?: string;
}

async function refreshYouTubeToken(connection: SocialConnection): Promise<string> {
  if (!connection.refresh) throw new Error("no_refresh_token");
  const settingsRes = await fetch("http://localhost:3000/api/admin/settings");
  const settings = await settingsRes.json();
  const { youtubeClientId, youtubeClientSecret } = settings.social;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: youtubeClientId,
      client_secret: youtubeClientSecret,
      refresh_token: connection.refresh,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.access_token;
}

export async function publishToYouTube(
  clipStorageKey: string,
  connection: SocialConnection,
  title: string = "ClipForge"
): Promise<PublishResult> {
  let token = connection.token;
  if (!token) return { ok: false, error: "no_token" };

  if (connection.expiresAt && new Date(connection.expiresAt) < new Date()) {
    try {
      token = await refreshYouTubeToken(connection);
    } catch (e: any) {
      return { ok: false, error: "token_refresh_failed: " + e.message };
    }
  }

  const filePath = join(process.cwd(), "storage", "clips", clipStorageKey);
  const fileBuffer = await readFile(filePath);

  const metadata = {
    snippet: { title, description: "Published via ClipForge", tags: ["ClipForge"], categoryId: "22" },
    status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
  };

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(fileBuffer.length),
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.text();
    console.error("[YouTube] Init error:", err);
    return { ok: false, error: "youtube_init_failed" };
  }

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) return { ok: false, error: "no_upload_url" };

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    console.error("[YouTube] Upload error:", err);
    return { ok: false, error: "youtube_upload_failed" };
  }

  const uploadData = await uploadRes.json();
  const videoId = uploadData.id;

  return { ok: true, remoteUrl: `https://youtube.com/watch?v=${videoId}` };
}
