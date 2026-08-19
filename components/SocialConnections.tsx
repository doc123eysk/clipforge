"use client";

import toast from "react-hot-toast";

interface Connection {
  provider: string;
  status: string;
  username: string | null;
}

const PROVIDERS = [
  {
    id: "youtube", name: "YouTube Shorts",
    gradient: "from-red-500/20 to-red-600/20", border: "border-red-500/30", text: "text-red-400",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>,
  },
  {
    id: "vk", name: "VK Clips",
    gradient: "from-blue-500/20 to-blue-600/20", border: "border-blue-500/30", text: "text-blue-400",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2z"/><path d="M6 10.5c1.5-3.5 3.5-5 6-5s3 1.5 1.5 5c-1 2.5-2 4-2.5 4.5"/><path d="M14 14s1 1.5 2.5 3c1 1 2 1.5 2.5 1.5"/></svg>,
  },
  {
    id: "tiktok", name: "TikTok",
    gradient: "from-pink-500/20 to-cyan-400/20", border: "border-pink-500/30", text: "text-pink-400",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>,
  },
  {
    id: "instagram", name: "Instagram Reels",
    gradient: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/30", text: "text-purple-400",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  },
];

export function SocialConnections({ connections }: { connections: Connection[] }) {
  function isConnected(provider: string) {
    return connections.find((c) => c.provider === provider && c.status === "active");
  }

  async function handleConnect(provider: string) {
    try {
      const res = await fetch(`/api/social/connect?provider=${provider}`);
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.open(url, "_blank", "width=600,height=700");
    } catch {
      toast.error("Не удалось подключить");
    }
  }

  return (
    <div className="space-y-3">
      {PROVIDERS.map((p) => {
        const conn = isConnected(p.id);
        return (
          <div
            key={p.id}
            className={`card-glow flex items-center justify-between rounded-2xl border px-5 py-4 transition-all duration-300 ${
              conn ? `${p.border} ${p.gradient}` : "border-white/5 bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${p.gradient}`}>
                {p.icon}
              </div>
              <div>
                <div className="font-medium text-zinc-200">{p.name}</div>
                {conn ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Подключено{conn.username ? ` (@${conn.username})` : ""}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500">Не подключено</div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleConnect(p.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                conn
                  ? "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5"
                  : `bg-gradient-to-r ${p.gradient} ${p.text} ${p.border} border hover:opacity-80`
              }`}
            >
              {conn ? "Переподключить" : "Подключить"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
