"use client";

import { useState } from "react";

interface Props {
  clipId: string;
  open: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

const PROVIDERS = [
  { id: "vk", name: "VK", color: "#4C75A3" },
  { id: "youtube", name: "YouTube", color: "#FF0000" },
  { id: "tiktok", name: "TikTok", color: "#00f2ea" },
  { id: "instagram", name: "Instagram", color: "#E4405F" },
];

export function ScheduleModal({ clipId, open, onClose, onScheduled }: Props) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [provider, setProvider] = useState("vk");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clips/${clipId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: new Date(date).toISOString(), provider }),
      });
      if (res.ok) {
        onScheduled();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Ошибка");
      }
    } catch {
      alert("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass card-glow rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-zinc-200">Отложить публикацию</h3>

        <label className="mb-1 block text-xs text-zinc-500">Дата и время</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
        />

        <label className="mb-2 block text-xs text-zinc-500">Платформа</label>
        <div className="mb-4 flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                provider === p.id
                  ? "text-white"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
              style={provider === p.id ? { backgroundColor: p.color + "40", color: p.color } : {}}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg bg-white/5 py-2 text-sm text-zinc-400 transition hover:bg-white/10">
            Отмена
          </button>
          <button
            onClick={handleSchedule}
            disabled={loading}
            className="flex-1 rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? "..." : "Запланировать"}
          </button>
        </div>
      </div>
    </div>
  );
}
