"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats { totalUsers: number; totalVideos: number; totalClips: number; proUsers: number; clipsByStatus: Record<string, number>; }
interface User { id: string; email: string; kind: string; createdAt: string; videoCount: number; }
interface Video { id: string; title: string; durationSec: number; createdAt: string; userEmail: string; clipCount: number; }

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then((d) => {
      setStats(d);
      setUsers(d.recentUsers || []);
      setVideos(d.recentVideos || []);
    }).catch(() => {});
  }, []);

  if (!stats) return <div className="flex items-center justify-center py-20"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"><animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" /></circle></svg></div>;

  const cards = [
    { label: "Пользователей", value: stats.totalUsers },
    { label: "Видео", value: stats.totalVideos },
    { label: "Клипов", value: stats.totalClips },
    { label: "PRO", value: stats.proUsers },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <h1 className="text-2xl sm:text-4xl font-bold"><span className="gradient-text">Админ-панель</span></h1>
        <div className="flex gap-2">
          <Link href="/admin" className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-700">Дашборд</Link>
          <Link href="/admin/settings" className="rounded-xl border border-black/10 bg-black/5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 transition">Настройки</Link>
        </div>
      </div>

      <div className="mb-8 sm:mb-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-5">
            <div className="text-2xl sm:text-3xl font-bold text-zinc-900">{c.value}</div>
            <div className="mt-1 text-xs sm:text-sm text-zinc-400">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        <div className="glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h2 className="mb-4 text-base sm:text-lg font-semibold text-zinc-800">Пользователи</h2>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl bg-black/[0.02] border border-black/5 px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-800">{u.email}</div>
                  <div className="text-xs text-zinc-400">{new Date(u.createdAt).toLocaleDateString("ru-RU")} · {u.videoCount} видео</div>
                </div>
                <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${u.kind === "admin" ? "bg-amber-100 text-amber-700" : u.kind === "registered" ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-500"}`}>
                  {u.kind === "admin" ? "ADM" : u.kind === "registered" ? "USER" : "GUEST"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h2 className="mb-4 text-base sm:text-lg font-semibold text-zinc-800">Видео</h2>
          <div className="space-y-2">
            {videos.map((v) => (
              <a key={v.id} href={`/videos/${v.id}`} className="flex items-center justify-between rounded-xl bg-black/[0.02] border border-black/5 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-black/[0.04] transition">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-800">{v.title}</div>
                  <div className="text-xs text-zinc-400">{v.userEmail} · {Math.round(v.durationSec / 60)} мин · {v.clipCount} клипов</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
