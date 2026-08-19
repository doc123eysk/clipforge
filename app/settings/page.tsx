import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SocialConnections } from "@/components/SocialConnections";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  const connections = user.id
    ? await prisma.socialConnection.findMany({ where: { userId: user.id } })
    : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full badge px-4 py-1.5 text-xs font-medium text-indigo-300">
          Настройки
        </div>
        <h1 className="text-4xl font-bold">
          <span className="gradient-text">Профиль</span>
        </h1>
      </div>

      {/* Profile */}
      <section className="animate-slide-up glass card-glow rounded-3xl p-8 mb-8">
        <h2 className="mb-6 text-lg font-semibold text-zinc-200">Аккаунт</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
            <span className="text-sm text-zinc-500">Email</span>
            <span className="text-sm text-zinc-300">{user.email || "Не указан (гость)"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
            <span className="text-sm text-zinc-500">Тариф</span>
            <span className={`text-sm font-medium ${user.subscription?.plan === "pro" ? "text-amber-400" : "text-zinc-400"}`}>
              {user.subscription?.plan === "pro" ? "PRO" : "Free"}
            </span>
          </div>
        </div>
      </section>

      {/* Social */}
      <section className="animate-slide-up delay-100 glass card-glow rounded-3xl p-8">
        <h2 className="mb-6 text-lg font-semibold text-zinc-200">Социальные сети</h2>
        <SocialConnections
          connections={connections.map((c) => ({
            provider: c.provider,
            status: c.status,
            username: c.username,
          }))}
        />
      </section>
    </div>
  );
}
