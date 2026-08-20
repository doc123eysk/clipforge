"use client";

import { useState, useEffect, useCallback } from "react";

interface Publication {
  id: string;
  clipId: string;
  provider: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  remoteUrl: string | null;
  error: string | null;
  retryCount: number;
  clip: {
    id: string;
    startSec: number;
    endSec: number;
    video: { title: string };
  };
}

const PROVIDER_COLORS: Record<string, string> = {
  vk: "#4C75A3",
  youtube: "#FF0000",
  tiktok: "#00f2ea",
  instagram: "#E4405F",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Запланировано", color: "bg-blue-500/20 text-blue-400" },
  pending: { label: "Ожидает", color: "bg-yellow-500/20 text-yellow-400" },
  processing: { label: "Публикуется", color: "bg-purple-500/20 text-purple-400" },
  published: { label: "Опубликовано", color: "bg-green-500/20 text-green-400" },
  error: { label: "Ошибка", color: "bg-red-500/20 text-red-400" },
  cancelled: { label: "Отменено", color: "bg-zinc-500/20 text-zinc-400" },
};

function formatDt(s: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function timeLeft(s: string | null) {
  if (!s) return "";
  const diff = new Date(s).getTime() - Date.now();
  if (diff <= 0) return "сейчас";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `через ${mins} мин`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `через ${hrs} ч ${mins % 60} мин`;
  return `через ${Math.floor(hrs / 24)} д`;
}

export function ScheduleQueue() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("provider", filter);
    const res = await fetch(`/api/schedule?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPublications(data.publications || []);
    }
  }, [filter]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  const publishNow = async (id: string) => {
    await fetch(`/api/schedule/${id}/publish-now`, { method: "POST" });
    load();
  };

  const deletePub = async (id: string) => {
    if (!confirm("Удалить?")) return;
    await fetch("/api/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const saveEdit = async (id: string) => {
    await fetch(`/api/schedule/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: new Date(editDate).toISOString() }),
    });
    setEditingId(null);
    load();
  };

  const tabs = [
    { id: "all", label: "Все" },
    { id: "vk", label: "VK" },
    { id: "youtube", label: "YouTube" },
    { id: "tiktok", label: "TikTok" },
    { id: "instagram", label: "Instagram" },
  ];

  return (
    <div>
      <div className="mb-4 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === t.id ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-zinc-500 hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {publications.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-500">Нет запланированных публикаций</div>
      ) : (
        <div className="space-y-2">
          {publications.map((pub) => {
            const st = STATUS_LABELS[pub.status] || STATUS_LABELS.pending;
            return (
              <div key={pub.id} className="glass rounded-xl p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: PROVIDER_COLORS[pub.provider] || "#666" }}>
                    {pub.provider.toUpperCase().slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">{pub.clip.video.title}</p>
                    <p className="text-xs text-zinc-500">
                      {pub.clip.startSec.toFixed(1)}s — {pub.clip.endSec.toFixed(1)}s
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${st.color}`}>{st.label}</span>
                      {pub.status === "scheduled" && pub.scheduledAt && (
                        <span className="text-[10px] text-zinc-600">{timeLeft(pub.scheduledAt)}</span>
                      )}
                      {pub.status === "error" && pub.error && (
                        <span className="text-[10px] text-red-400">{pub.error}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {pub.status === "scheduled" && (
                      <>
                        {editingId === pub.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="datetime-local"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="w-36 rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[10px] text-zinc-300"
                            />
                            <button onClick={() => saveEdit(pub.id)} className="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">OK</button>
                            <button onClick={() => setEditingId(null)} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500">✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingId(pub.id); setEditDate(pub.scheduledAt ? new Date(pub.scheduledAt).toISOString().slice(0, 16) : ""); }}
                            className="rounded bg-white/5 px-2 py-1 text-[10px] text-zinc-400 hover:bg-white/10"
                          >
                            Изменить
                          </button>
                        )}
                        <button onClick={() => publishNow(pub.id)} className="rounded bg-indigo-500/20 px-2 py-1 text-[10px] text-indigo-400 hover:bg-indigo-500/30">
                          Сейчас
                        </button>
                        <button onClick={() => deletePub(pub.id)} className="rounded bg-red-500/20 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/30">
                          Удалить
                        </button>
                      </>
                    )}
                    {pub.status === "error" && (
                      <button onClick={() => deletePub(pub.id)} className="rounded bg-red-500/20 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/30">
                        Удалить
                      </button>
                    )}
                    {pub.status === "published" && pub.remoteUrl && pub.remoteUrl !== "pending" && (
                      <a href={pub.remoteUrl} target="_blank" rel="noopener noreferrer" className="rounded bg-green-500/20 px-2 py-1 text-[10px] text-green-400 hover:bg-green-500/30">
                        Открыть
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
