import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getOrCreateGuest, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  let user = await getCurrentUser();
  if (!user.id) {
    user = await getOrCreateGuest();
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string) || "Без названия";

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = createHash("md5").update(buffer).digest("hex");

  const existing = await prisma.video.findFirst({
    where: { userId: user.id, hash },
  });
  if (existing) {
    const token = signToken({ userId: user.id });
    const res = NextResponse.json({ videoId: existing.id, duplicate: true });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return res;
  }

  const uploadDir = join(process.cwd(), "storage", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() || "mp4";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filepath = join(uploadDir, filename);

  await writeFile(filepath, buffer);

  let durationSec = 0;
  let width = 0;
  let height = 0;

  try {
    const { probeVideo } = await import("@/lib/ffmpeg");
    const meta = await probeVideo(filepath);
    durationSec = meta.durationSec;
    width = meta.width;
    height = meta.height;
  } catch (e) {
    console.log("[FFPROBE] Failed, using defaults:", e);
  }

  const video = await prisma.video.create({
    data: {
      userId: user.id,
      title,
      durationSec,
      width,
      height,
      storageKey: filename,
      hash,
      expiresAt: user.kind === "guest" ? new Date(Date.now() + 60 * 60 * 1000) : null,
    },
  });

  const token = signToken({ userId: user.id });

  const res = NextResponse.json({ videoId: video.id });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return res;
}
