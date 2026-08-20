"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface Props { currentPlan?: string }

const TIERS = [
  { key: "monthly", months: 1, label: "1 мес", discount: 0 },
  { key: "quarterly", months: 3, label: "3 мес", discount: 10 },
  { key: "halfyear", months: 6, label: "6 мес", discount: 15 },
  { key: "yearly", months: 12, label: "12 мес", discount: 30 },
];

export function SubscriptionButton({ currentPlan }: Props) {
  const [selected, setSelected] = useState("monthly");
  const [loading, setLoading] = useState(false);

  if (currentPlan === "pro") {
    return (
      <div className="rounded-xl bg-green-500/10 border border-green-500/20 py-3 text-center text-sm font-medium text-green-400">
        PRO активен
      </div>
    );
  }

  async function subscribe() {
    setLoading(true);
    try {
      const tier = TIERS.find((t) => t.key === selected)!;
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: tier.months }),
      });
      if (!res.ok) throw new Error();
      toast.success("PRO активирован!");
      window.location.reload();
    } catch { toast.error("Ошибка"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {TIERS.map((t) => (
          <button key={t.key} onClick={() => setSelected(t.key)}
            className={`rounded-xl px-3 py-2 text-xs font-medium transition ${selected === t.key ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300" : "bg-white/5 border border-white/5 text-zinc-500 hover:text-zinc-300"}`}>
            {t.label}{t.discount > 0 && <span className="ml-1 text-[10px] text-green-400">-{t.discount}%</span>}
          </button>
        ))}
      </div>
      <button onClick={subscribe} disabled={loading} className="btn-primary w-full rounded-xl py-3 font-bold text-white disabled:opacity-50">
        {loading ? "Активация..." : "Подключить PRO"}
      </button>
    </div>
  );
}
