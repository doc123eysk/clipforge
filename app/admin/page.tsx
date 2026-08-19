"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalVideos: number;
  totalClips: number;
  proUsers: number;
  guestUsers: number;
  registeredUsers: number;
  clipsByStatus: Record<string, number>;
}

interface User {
  id: string;
  email: string;
  kind: string;
  createdAt: string;
  videoCount: number;
  plan: string;
}

interface Video {
  id: string;
  title: string;
  durationSec: number;
  createdAt: string;
  userEmail: string;
  userKind: string;
  clipCount: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setStats(data.stats);
        setRecentUsers(data.recentUsers);
        setRecentVideos(data.recentVideos);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-center justify-center py-20">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
              <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <p className="text-zinc-500">Нет доступа или ошибка загрузки</p>
      </div>
    );
  }

  const statCards = stats ? [
    { label: "Пользователей", value: stats.totalUsers, icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ), color: "from-indigo-500/20 to-purple-500/20" },
    { label: "Видео", value: stats.totalVideos, icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ), color: "from-violet-500/20 to-fuchsia-500/20" },
    { label: "Клипов", value: stats.totalClips, icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    ), color: "from-purple-500/20 to-pink-500/20" },
    { label: "PRO", value: stats.proUsers, icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ), color: "from-amber-500/20 to-orange-500/20" },
  ] : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full badge px-4 py-1.5 text-xs font-medium text-indigo-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Админ-панель
          </div>
          <h1 className="text-4xl font-bold">
            <span className="gradient-text">Дашборд</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin" className="rounded-xl bg-indigo-500/20 border border-indigo-500/30 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/30">
            Дашборд
          </Link>
          <Link href="/admin/settings" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/10 hover:text-white">
            Настройки
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="animate-slide-up glass card-glow rounded-2xl p-5"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className="text-3xl font-bold text-zinc-100">{card.value}</div>
            <div className="mt-1 text-sm text-zinc-500">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Clips by status */}
      {stats && (
        <div className="mb-10 animate-slide-up delay-200 glass card-glow rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Клипы по статусу</h2>
          <div className="flex gap-4">
            {Object.entries(stats.clipsByStatus).map(([status, count]) => {
              const colors: Record<string, string> = {
                pending: "bg-zinc-500",
                processing: "bg-indigo-500",
                ready: "bg-green-500",
                error: "bg-red-500",
              };
              const labels: Record<string, string> = {
                pending: "Ожидает",
                processing: "Обработка",
                ready: "Готово",
                error: "Ошибка",
              };
              return (
                <div key={status} className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5">
                  <span className={`h-2 w-2 rounded-full ${colors[status] || "bg-zinc-500"}`} />
                  <span className="text-sm text-zinc-400">{labels[status] || status}</span>
                  <span className="ml-1 text-sm font-bold text-zinc-200">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="animate-slide-up delay-300 glass card-glow rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Последние пользователи</h2>
          <div className="space-y-2">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3 transition hover:bg-white/[0.04]">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-200">{u.email}</div>
                  <div className="text-xs text-zinc-500">{new Date(u.createdAt).toLocaleDateString("ru-RU")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">{u.videoCount} видео</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    u.kind === "admin" ? "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                    : u.kind === "registered" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                    : "bg-zinc-700/50 text-zinc-400 border border-white/5"
                  }`}>
                    {u.kind === "admin" ? "ADM" : u.kind === "registered" ? "USER" : "GUEST"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Videos */}
        <div className="animate-slide-up delay-400 glass card-glow rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">Последние видео</h2>
          <div className="space-y-2">
            {recentVideos.map((v) => (
              <a
                key={v.id}
                href={`/videos/${v.id}`}
                className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3 transition hover:bg-white/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-200">{v.title}</div>
                  <div className="text-xs text-zinc-500">
                    {v.userEmail} · {Math.round(v.durationSec / 60)}:{String(Math.round(v.durationSec % 60)).padStart(2, "0")} · {v.clipCount} клипов
                  </div>
                </div>
                <div className="text-xs text-zinc-600">{new Date(v.createdAt).toLocaleDateString("ru-RU")}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
