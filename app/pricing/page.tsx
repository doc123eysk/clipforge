import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { SubscriptionButton } from "@/components/SubscriptionButton";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const user = await getCurrentUser();
  const settings = await getSettings();
  const p = settings.pricing;

  const quarterly = Math.round(p.monthlyPrice * 3 * (1 - p.quarterlyDiscount / 100));
  const halfyear = Math.round(p.monthlyPrice * 6 * (1 - p.halfyearDiscount / 100));
  const yearly = Math.round(p.monthlyPrice * 12 * (1 - p.yearlyDiscount / 100));

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-16 text-center">
        <div className="animate-slide-up mb-4 inline-flex items-center gap-2 rounded-full badge px-4 py-1.5 text-xs font-medium text-indigo-300">
          Тарифы
        </div>
        <h1 className="animate-slide-up delay-100 mb-4 text-5xl font-bold">
          <span className="gradient-text">Выберите план</span>
        </h1>
        <p className="animate-slide-up delay-200 text-lg text-zinc-500">Начните бесплатно, обновите когда будете готовы</p>
        {p.promoEnabled && p.promoCode && (
          <div className="animate-slide-up delay-300 mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-xs font-medium text-amber-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            Промокод <span className="font-mono text-amber-200">{p.promoCode}</span> — скидка {p.promoDiscount}%
          </div>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Free */}
        <div className="animate-slide-up delay-300 glass card-glow rounded-3xl p-8">
          <div className="mb-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/50">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-zinc-200">Free</h2>
            <p className="mt-1 text-sm text-zinc-500">Для знакомства с сервисом</p>
          </div>
          <div className="mb-8">
            <span className="text-5xl font-bold text-zinc-300">0 ₽</span>
            <span className="ml-2 text-sm text-zinc-600">навсегда</span>
          </div>
          <ul className="mb-8 space-y-3">
            {[
              `Видео до ${Math.round(settings.limits.maxVideoDurationFree / 60)} минут`,
              `До ${settings.limits.maxClipsPerVideoFree} отрезков на видео`,
              `До ${settings.limits.maxClipDuration} сек каждый`,
              "Водяной знак на клипах",
              "1 ГБ хранилище",
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-zinc-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-500">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-zinc-800/30 py-3 text-center text-sm text-zinc-500 border border-white/5">
            {user.subscription?.plan === "free" || !user.subscription?.plan ? "Текущий тариф" : "Переключиться"}
          </div>
        </div>

        {/* Pro */}
        <div className="animate-slide-up delay-400 relative glass neon-border card-glow rounded-3xl p-8">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25">
            ПОПУЛЯРНЫЙ
          </div>
          <div className="mb-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-zinc-200">PRO</h2>
            <p className="mt-1 text-sm text-zinc-500">Для профессиональных создателей</p>
          </div>
          <div className="mb-4">
            <span className="text-5xl font-bold gradient-text">{p.monthlyPrice} ₽</span>
            <span className="ml-2 text-sm text-zinc-600">/мес</span>
          </div>
          <div className="mb-8 flex flex-wrap gap-2">
            {p.quarterlyDiscount > 0 && (
              <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs text-indigo-300">
                3 мес: {quarterly} ₽ (−{p.quarterlyDiscount}%)
              </span>
            )}
            {p.halfyearDiscount > 0 && (
              <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs text-purple-300">
                6 мес: {halfyear} ₽ (−{p.halfyearDiscount}%)
              </span>
            )}
            {p.yearlyDiscount > 0 && (
              <span className="rounded-full bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-xs text-pink-300">
                12 мес: {yearly} ₽ (−{p.yearlyDiscount}%)
              </span>
            )}
          </div>
          <ul className="mb-8 space-y-3">
            {[
              `Видео до ${Math.round(settings.limits.maxVideoDurationPro / 60)} мин`,
              `До ${settings.limits.maxClipsPerVideoPro} отрезков`,
              `До ${Math.round(settings.limits.maxClipDuration * 3 / 60)} мин каждый`,
              "Без водяного знака",
              "100 ГБ хранилище",
              "Приоритетная обработка",
              "Автопубликация в соцсети",
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-zinc-400">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] text-indigo-400">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <SubscriptionButton currentPlan={user.subscription?.plan} />
        </div>
      </div>
    </div>
  );
}
