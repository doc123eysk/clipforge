import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SubscriptionButton } from "@/components/SubscriptionButton";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await getCurrentUser();
  const settings = await getSettings();
  const p = settings.pricing;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-20">
      <div className="mb-10 sm:mb-16 text-center">
        <h1 className="animate-slide-up mb-3 sm:mb-4 text-3xl sm:text-5xl font-bold"><span className="gradient-text">Выберите план</span></h1>
        <p className="animate-slide-up delay-100 text-base sm:text-lg text-zinc-500">Начните бесплатно, обновите когда будете готовы</p>
      </div>
      <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
        <div className="glass card-glow rounded-2xl sm:rounded-3xl p-6 sm:p-8">
          <h2 className="mb-2 text-xl font-bold text-zinc-800">Free</h2>
          <p className="mb-4 sm:mb-6 text-sm text-zinc-500">Для знакомства с сервисом</p>
          <div className="mb-6 sm:mb-8"><span className="text-4xl sm:text-5xl font-bold text-zinc-400">0 ₽</span><span className="ml-2 text-sm text-zinc-400">навсегда</span></div>
          <ul className="mb-6 sm:mb-8 space-y-3">
            {[
              `Видео до ${Math.round(settings.limits.maxVideoDurationFree / 60)} мин`,
              `До ${settings.limits.maxClipsPerVideoFree} клипов`,
              `До ${settings.limits.maxClipDuration} сек каждый`,
              "Водяной знак",
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-zinc-500">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] text-zinc-500">✓</span>{f}
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-zinc-100 py-3 text-center text-sm text-zinc-500 border border-black/5">
            {!user.subscription?.plan || user.subscription.plan === "free" ? "Текущий" : "Переключиться"}
          </div>
        </div>
        <div className="relative glass neon-border card-glow rounded-2xl sm:rounded-3xl p-6 sm:p-8">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 sm:px-5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-white shadow-lg">ПОПУЛЯРНЫЙ</div>
          <h2 className="mb-2 text-xl font-bold text-zinc-800">PRO</h2>
          <p className="mb-4 sm:mb-6 text-sm text-zinc-500">Для профессионалов</p>
          <div className="mb-3 sm:mb-4"><span className="text-4xl sm:text-5xl font-bold gradient-text">{p.monthlyPrice} ₽</span><span className="ml-2 text-sm text-zinc-400">/мес</span></div>
          <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
            {p.quarterlyDiscount > 0 && <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs text-indigo-600">3 мес: −{p.quarterlyDiscount}%</span>}
            {p.halfyearDiscount > 0 && <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs text-purple-600">6 мес: −{p.halfyearDiscount}%</span>}
            {p.yearlyDiscount > 0 && <span className="rounded-full bg-pink-50 border border-pink-200 px-3 py-1 text-xs text-pink-600">12 мес: −{p.yearlyDiscount}%</span>}
          </div>
          <ul className="mb-6 sm:mb-8 space-y-3">
            {[
              `Видео до ${Math.round(settings.limits.maxVideoDurationPro / 60)} мин`,
              `До ${settings.limits.maxClipsPerVideoPro} клипов`,
              `До ${settings.limits.maxClipDuration * 3} сек каждый`,
              "Без водяного знака",
              "Приоритетная обработка",
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-zinc-500">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] text-indigo-600">✓</span>{f}
              </li>
            ))}
          </ul>
          <SubscriptionButton currentPlan={user.subscription?.plan} expiresAt={user.subscription?.expiresAt?.toISOString() ?? null} />
        </div>
      </div>
    </div>
  );
}
