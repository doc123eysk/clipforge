import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPlan, getPlanLimits } from "@/lib/limits";
import { Clipper } from "@/components/Clipper";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const plan = getPlan(user);
  const limits = getPlanLimits(plan);

  const video = await prisma.video.findFirst({ where: { id, userId: user.id } });
  if (!video) notFound();
  if (video.expiresAt && video.expiresAt < new Date()) notFound();

  const clips = user.kind === "guest"
    ? []
    : await prisma.clip.findMany({
        where: { videoId: video.id },
        orderBy: { createdAt: "desc" },
      });

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="animate-slide-in">
          <Link href="/" className="group mb-1 flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition group-hover:-translate-x-1">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Мои видео
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100">{video.title}</h1>
        </div>
        <div className="animate-slide-in delay-100 flex items-center gap-3">
          <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            plan === "pro"
              ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/20"
              : "badge text-zinc-400"
          }`}>
            {plan === "pro" ? (
              <span className="inline-flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                PRO
              </span>
            ) : "Free"} · до {limits.maxClipsPerVideo} отрезков
          </span>
        </div>
      </div>

      <div className="animate-slide-up delay-200">
        <Clipper
          video={{
            id: video.id,
            title: video.title,
            durationSec: video.durationSec,
            width: video.width,
            height: video.height,
            storageKey: video.storageKey,
          }}
          initialClips={clips.map((c) => ({
            id: c.id,
            startSec: c.startSec,
            endSec: c.endSec,
            status: c.status,
            progress: c.progress,
            storageKey: c.storageKey ?? undefined,
            watermarked: c.watermarked,
          }))}
          maxClips={limits.maxClipsPerVideo}
        />
      </div>
    </div>
  );
}
