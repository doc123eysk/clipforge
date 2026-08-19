"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface Props {
  email: string | null;
  kind: string;
}

export function AuthButton({ email: initialEmail, kind: initialKind }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [kind, setKind] = useState(initialKind);
  const [open, setOpen] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.email) setEmail(data.email);
        if (data.kind) setKind(data.kind);
      })
      .catch(() => {});
  }, []);

  if (kind === "registered" && email) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        {email}
      </div>
    );
  }

  if (kind === "admin" && email) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        {email}
      </div>
    );
  }

  async function handleSendCode() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inputEmail }),
      });
      if (!res.ok) throw new Error();
      setStep("code");
      toast.success("Код отправлен на почту!");
    } catch {
      toast.error("Ошибка отправки");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inputEmail, code }),
      });
      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data.error || "Invalid code");
      }

      toast.success("Добро пожаловать!");
      window.location.href = "/auth/callback?token=" + encodeURIComponent(data.token);
    } catch (err: any) {
      toast.error(err.message || "Неверный код");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary rounded-xl px-5 py-2.5 font-medium text-white"
      >
        <span>Войти</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="glass neon-border card-glow w-full max-w-sm rounded-3xl p-8 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-100">Вход в ClipForge</h2>
            </div>

            {step === "email" ? (
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-zinc-100 outline-none transition focus:border-indigo-500 focus:bg-white/[0.07] focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  onClick={handleSendCode}
                  disabled={loading || !inputEmail}
                  className="btn-primary w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-50"
                >
                  <span>{loading ? "Отправка..." : "Получить код"}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-zinc-500">Код отправлен на <span className="text-zinc-300">{inputEmail}</span></p>
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-center text-3xl tracking-[0.4em] font-mono text-zinc-100 outline-none transition focus:border-indigo-500 focus:bg-white/[0.07] focus:ring-2 focus:ring-indigo-500/20"
                  maxLength={6}
                  autoFocus
                />
                <button
                  onClick={handleVerify}
                  disabled={loading || code.length < 4}
                  className="btn-primary w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-50"
                >
                  <span>{loading ? "Проверка..." : "Войти"}</span>
                </button>
                <button
                  onClick={() => { setStep("email"); setCode(""); }}
                  className="flex items-center justify-center gap-1.5 w-full text-sm text-zinc-500 hover:text-zinc-300 transition"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Другой email
                </button>
              </div>
            )}

            <button onClick={() => setOpen(false)} className="mt-4 w-full text-sm text-zinc-600 hover:text-zinc-400 transition">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
