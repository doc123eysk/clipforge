"use client";

import { useState, useEffect } from "react";

interface User { email: string; kind: string; subscription?: { plan: string }; }
interface Connection { id: string; provider: string; status: string; }

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.user) setUser(d.user); });
    // connections could be fetched here if we add an API endpoint
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold"><span className="gradient-text">Настройки</span></h1>
      <div className="glass card-glow rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">Профиль</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3">
            <span className="text-sm text-zinc-400">Email</span>
            <span className="text-sm text-zinc-200">{user?.email || "Гость"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3">
            <span className="text-sm text-zinc-400">Тариф</span>
            <span className="text-sm text-zinc-200">{user?.subscription?.plan === "pro" ? "PRO" : "Free"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3">
            <span className="text-sm text-zinc-400">Тип</span>
            <span className="text-sm text-zinc-200">{user?.kind || "guest"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
