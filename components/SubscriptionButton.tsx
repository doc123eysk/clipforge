"use client";

import { useState } from "react";
import { PRO_PRICING, type ProTier } from "@/lib/pricing";
import toast from "react-hot-toast";

export function SubscriptionButton({ currentPlan }: { currentPlan?: string }) {
  const [selectedTier, setSelectedTier] = useState<ProTier>("monthly");
  const [loading, setLoading] = useState(false);

  if (currentPlan === "pro") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 py-3 text-sm font-medium text-indigo-300">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        PRO активен
      </div>
    );
  }

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: PRO_PRICING[selectedTier].months }),
      });
      if (!res.ok) throw new Error();
      toast.success("Подписка PRO активирована!");
      window.location.reload();
    } catch {
      toast.error("Ошибка активации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(PRO_PRICING) as [ProTier, (typeof PRO_PRICING)[ProTier]][]).map(([key, tier]) => (
          <button
            key={key}
            onClick={() => setSelectedTier(key)}
            className={`relative rounded-xl border p-3 text-left transition-all duration-300 ${
              selectedTier === key
                ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
            }`}
          >
            {"saveLabel" in tier && (
              <span className="absolute -top-2 -right-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-green-500/25">
                {tier.saveLabel}
              </span>
            )}
            <div className="text-xs text-zinc-500">{tier.label}</div>
            <div className="mt-1 text-lg font-bold text-zinc-200">{tier.price} ₽</div>
          </button>
        ))}
      </div>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="btn-primary w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-50"
      >
        <span>{loading ? "Активация..." : `Подключить PRO — ${PRO_PRICING[selectedTier].price} ₽`}</span>
      </button>
    </div>
  );
}
