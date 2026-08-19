import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UploadZone } from "@/components/UploadZone";
import Link from "next/link";
import { unlink } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

async function cleanupExpiredVideos() {
  const expired = await prisma.video.findMany({
    where: { expiresAt: { not: null, lt: new Date() } },
    select: { id: true, storageKey: true },
  });
  if (!expired.length) return;

  for (const v of expired) {
    try { await unlink(join(process.cwd(), "storage", "uploads", v.storageKey)); } catch {}
  }
  await prisma.video.deleteMany({ where: { id: { in: expired.map((v) => v.id) } } });
}

export default async function HomePage() {
  const user = await getCurrentUser();

  let videos: { id: string; title: string; durationSec: number; createdAt: Date; clips: { id: string }[] }[] = [];

  if (user.id) {
    await cleanupExpiredVideos();
    videos = await prisma.video.findMany({
      where: { userId: user.id },
      include: { clips: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16">
      {/* Hero */}
      <div className="mb-16 text-center">
        <div className="animate-slide-up mb-6 inline-flex items-center gap-2 rounded-full badge px-4 py-1.5 text-xs font-medium text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          Бесплатно для начала
        </div>
        <h1 className="animate-slide-up delay-100 mb-6 text-5xl font-bold tracking-tight md:text-7xl">
          <span className="gradient-text">Нарежьте видео</span>
          <br />
          <span className="text-zinc-300">на короткие clips</span>
        </h1>
        <p className="animate-slide-up delay-200 mx-auto max-w-2xl text-lg text-zinc-500 leading-relaxed">
          Загрузите длинное видео, выберите нужные отрезки на интерактивном таймлайне
          и экспортируйте готовые shorts для YouTube, TikTok, VK и Instagram
        </p>
      </div>

      {/* Upload */}
      <div className="animate-slide-up delay-300">
        <UploadZone userKind={user.kind} />
      </div>

      {/* Videos list */}
      {videos.length > 0 && (
        <div className="mt-20">
          <h2 className="animate-slide-up mb-8 text-2xl font-bold text-zinc-200">Ваши видео</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v, i) => (
              <Link
                key={v.id}
                href={`/videos/${v.id}`}
                className={`animate-slide-up glass card-glow neon-border group rounded-2xl p-5`}
                style={{ animationDelay: `${0.4 + i * 0.05}s` }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 transition group-hover:scale-110">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-zinc-200 transition group-hover:text-white">{v.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1 w-1 rounded-full bg-indigo-400" />
                    {Math.floor(v.durationSec / 60)} мин
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1 w-1 rounded-full bg-purple-400" />
                    {v.clips.length} клипов
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1 w-1 rounded-full bg-pink-400" />
                    {v.createdAt.toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {videos.length === 0 && user.id && (
        <div className="animate-slide-up delay-500 mt-20 text-center">
          <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-float">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <p className="text-zinc-500">Пока нет видео. Загрузите первое!</p>
        </div>
      )}
    </div>
  );
}
