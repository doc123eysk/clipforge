import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateGuest, signToken } from "@/lib/auth";
import { probeVideo } from "@/lib/ffmpeg";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || file?.name || "Видео";

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    let user;

    if (tokenMatch) {
      const { verifyToken } = await import("@/lib/auth");
      const payload = verifyToken(tokenMatch[1]);
      if (payload) {
        const u = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (u) user = { id: u.id, email: u.email, kind: u.kind };
      }
    }
    if (!user) {
      user = await getOrCreateGuest();
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const hash = createHash("md5").update(bytes).digest("hex");

    const existing = await prisma.video.findFirst({
      where: { userId: user.id, hash },
    });
    if (existing) {
      return NextResponse.json({ error: "Это видео уже загружено" }, { status: 409 });
    }

    const storageKey = `${user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const uploadDir = join(process.cwd(), "storage", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, storageKey);
    await writeFile(filePath, bytes);

    const meta = await probeVideo(filePath);

    const { getSettings } = await import("@/lib/settings");
    const settings = await getSettings();
    const isGuest = user.kind === "guest";
    const maxDur = isGuest ? settings.limits.maxVideoDurationFree : settings.limits.maxVideoDurationPro;

    if (meta.durationSec > maxDur) {
      return NextResponse.json(
        { error: `Видео слишком длинное. Максимум ${Math.round(maxDur / 60)} мин` },
        { status: 400 }
      );
    }

    const expiresAt = isGuest ? new Date(Date.now() + settings.limits.guestVideoExpiryHours * 3600000) : null;

    const video = await prisma.video.create({
      data: {
        userId: user.id,
        title,
        durationSec: meta.durationSec,
        width: meta.width,
        height: meta.height,
        storageKey,
        hash,
        expiresAt,
      },
    });

    const newToken = signToken({ userId: user.id });
    const res = NextResponse.json({ ok: true, videoId: video.id });
    res.cookies.set("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("[UPLOAD] Error:", err.message);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
