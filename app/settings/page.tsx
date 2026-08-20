import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VkConnectButton } from "@/components/VkConnectButton";
import { SocialConnections } from "@/components/SocialConnections";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const connections = user.id ? await prisma.socialConnection.findMany({ where: { userId: user.id } }) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold"><span className="gradient-text">Настройки</span></h1>
      <div className="glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h2 className="mb-4 text-base sm:text-lg font-semibold text-zinc-800">Профиль</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-black/[0.02] border border-black/5 px-3 sm:px-4 py-3">
            <span className="text-sm text-zinc-500">Email</span>
            <span className="text-sm text-zinc-800 truncate ml-4">{user.email || "Гость"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-black/[0.02] border border-black/5 px-3 sm:px-4 py-3">
            <span className="text-sm text-zinc-500">Тариф</span>
            <span className="text-sm text-zinc-800">{user.subscription?.plan === "pro" ? "PRO" : "Free"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-black/[0.02] border border-black/5 px-3 sm:px-4 py-3">
            <span className="text-sm text-zinc-500">Тип</span>
            <span className="text-sm text-zinc-800">{user.kind}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 sm:mt-6 glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h2 className="mb-4 text-base sm:text-lg font-semibold text-zinc-800">Соцсети</h2>
        <p className="mb-4 text-xs text-zinc-400">Подключите соцсети для публикации клипов напрямую</p>
        <SocialConnections connections={connections.map((c) => ({ provider: c.provider, username: c.username, remoteId: c.remoteId }))} />
      </div>
    </div>
  );
}
