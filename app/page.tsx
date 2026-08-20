import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { UploadZone } from "@/components/UploadZone";
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

async function cleanupExpired() {
  const expired = await prisma.video.findMany({ where: { expiresAt: { lt: new Date() } } });
  for (const v of expired) {
    try { const { unlink } = await import("fs/promises"); const { join } = await import("path"); await unlink(join(process.cwd(), "storage", "uploads", v.storageKey)); } catch {}
  }
  await prisma.video.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

export default async function HomePage() {
  await cleanupExpired();
  const user = await getCurrentUser();

  const videos = user.id
    ? await prisma.video.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { clips: true } } } })
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8 sm:mb-12 text-center">
        <h1 className="animate-slide-up mb-3 sm:mb-4 text-3xl sm:text-5xl font-bold">
          <span className="gradient-text">Нарежьте видео</span>
        </h1>
        <p className="animate-slide-up delay-100 text-base sm:text-lg text-zinc-500">Загрузите видео, выделите клипы на таймлайне, скачайте shorts</p>
      </div>

      <div className="mb-8 sm:mb-12">
        <UploadZone userKind={user.kind} />
      </div>

      {videos.length > 0 && (
        <div>
          <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-semibold text-zinc-800">Ваши видео</h2>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {videos.map((v) => (
              <a key={v.id} href={`/videos/${v.id}`} className="glass card-glow flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition hover:bg-black/[0.03]">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-800 text-sm sm:text-base">{v.title}</p>
                  <p className="text-xs text-zinc-400">{formatDuration(v.durationSec)} · {v._count.clips} клипов</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
