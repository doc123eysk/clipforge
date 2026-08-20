import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const connections = user.id ? await prisma.socialConnection.findMany({ where: { userId: user.id } }) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold"><span className="gradient-text">Настройки</span></h1>
      <div className="glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h2 className="mb-4 text-base sm:text-lg font-semibold text-zinc-200">Профиль</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-3 sm:px-4 py-3">
            <span className="text-sm text-zinc-400">Email</span>
            <span className="text-sm text-zinc-200 truncate ml-4">{user.email || "Гость"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-3 sm:px-4 py-3">
            <span className="text-sm text-zinc-400">Тариф</span>
            <span className="text-sm text-zinc-200">{user.subscription?.plan === "pro" ? "PRO" : "Free"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-3 sm:px-4 py-3">
            <span className="text-sm text-zinc-400">Тип</span>
            <span className="text-sm text-zinc-200">{user.kind}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 sm:mt-6 glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <h2 className="mb-4 text-base sm:text-lg font-semibold text-zinc-200">Соцсети</h2>
        {connections.length === 0 ? (
          <p className="text-sm text-zinc-500">Нет подключённых соцсетей</p>
        ) : (
          <div className="space-y-2">
            {connections.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-3 sm:px-4 py-3">
                <span className="text-sm text-zinc-200 capitalize">{c.provider}</span>
                <span className={`text-xs ${c.status === "active" ? "text-green-400" : "text-zinc-500"}`}>{c.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
