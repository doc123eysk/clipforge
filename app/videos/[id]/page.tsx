import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Clipper } from "@/components/Clipper";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const settings = await getSettings();

  const video = await prisma.video.findUnique({ where: { id }, include: { clips: { orderBy: { createdAt: "desc" } } } });
  if (!video) return <div className="py-20 text-center text-zinc-500">Видео не найдено</div>;
  if (user.kind !== "admin" && video.userId !== user.id) return <div className="py-20 text-center text-zinc-500">Нет доступа</div>;

  if (video.expiresAt && video.expiresAt < new Date()) {
    return <div className="py-20 text-center text-zinc-500">Видео истекло</div>;
  }

  const isPro = user.subscription?.plan === "pro";
  const maxClips = isPro ? settings.limits.maxClipsPerVideoPro : settings.limits.maxClipsPerVideoFree;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold text-zinc-200">{video.title}</h1>
      <Clipper video={video} initialClips={user.kind === "guest" ? [] : video.clips} maxClips={maxClips} />
    </div>
  );
}
