import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { readFile } from "fs/promises";
import { join } from "path";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user.id) {
    return NextResponse.json({ error: "not_auth" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "video";

  const clip = await prisma.clip.findUnique({ where: { id } });
  if (!clip || clip.status !== "ready" || !clip.storageKey) {
    return NextResponse.json({ error: "clip_not_ready" }, { status: 400 });
  }

  const connection = await prisma.socialConnection.findUnique({
    where: { userId_provider: { userId: user.id, provider: "vk" } },
  });
  if (!connection || connection.status !== "active" || !connection.token) {
    return NextResponse.json({ error: "vk_not_connected" }, { status: 400 });
  }

  const token = connection.token;

  try {
    const filePath = join(process.cwd(), "storage", "clips", clip.storageKey);
    const fileBuffer = await readFile(filePath);
    const fileBlob = new Blob([fileBuffer], { type: "video/mp4" });

    if (type === "clip") {
      const saveRes = await fetch(
        `https://api.vk.com/method/clips.save?access_token=${token}&v=5.199`
      );
      const saveData = await saveRes.json();

      if (saveData.error) {
        console.error("[VK] clips.save error:", saveData.error);
        return NextResponse.json({ error: saveData.error.error_msg || "vk_clips_save_failed" }, { status: 500 });
      }

      const { upload_url } = saveData.response;

      const formData = new FormData();
      formData.append("file", fileBlob, "clip.mp4");

      const uploadRes = await fetch(upload_url, { method: "POST", body: formData });
      const uploadText = await uploadRes.text();

      if (!uploadRes.ok) {
        console.error("[VK] Clips upload failed:", uploadText);
        return NextResponse.json({ error: "vk_clips_upload_failed" }, { status: 500 });
      }

      await prisma.publication.create({
        data: {
          clipId: clip.id,
          provider: "vk",
          remoteUrl: "pending",
          status: "published",
          publishedAt: new Date(),
        },
      });

      return NextResponse.json({ ok: true, type: "clip" });
    }

    const saveRes = await fetch(
      `https://api.vk.com/method/video.save?access_token=${token}&v=5.199`
    );
    const saveData = await saveRes.json();

    if (saveData.error) {
      console.error("[VK] video.save error:", saveData.error);
      return NextResponse.json({ error: saveData.error.error_msg || "vk_save_failed" }, { status: 500 });
    }

    const { upload_url, video_id, owner_id } = saveData.response;

    const formData = new FormData();
    formData.append("video_file", fileBlob, "clip.mp4");

    const uploadRes = await fetch(upload_url, { method: "POST", body: formData });
    const uploadText = await uploadRes.text();

    if (!uploadRes.ok) {
      console.error("[VK] Upload failed:", uploadText);
      return NextResponse.json({ error: "vk_upload_failed" }, { status: 500 });
    }

    await prisma.publication.create({
      data: {
        clipId: clip.id,
        provider: "vk",
        remoteUrl: `https://vk.com/video${owner_id}_${video_id}`,
        status: "published",
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      type: "video",
      videoId: video_id,
      ownerId: owner_id,
      url: `https://vk.com/video${owner_id}_${video_id}`,
    });
  } catch (err: any) {
    console.error("[VK] Publish error:", err.message);
    return NextResponse.json({ error: "publish_failed" }, { status: 500 });
  }
}
