"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

interface Props {
  email: string | null;
  kind: string;
}

export function AuthButton({ email: initialEmail, kind: initialKind }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [kind, setKind] = useState(initialKind);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.email) setEmail(d.email); if (d.kind) setKind(d.kind); })
      .catch(() => {});
  }, []);

  if ((kind === "registered" || kind === "admin") && email) {
    const isAdmin = kind === "admin";
    return (
      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isAdmin ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-black/[0.03] border border-black/5 text-zinc-500"}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isAdmin ? "#f59e0b" : "#6366f1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isAdmin
            ? <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
          }
        </svg>
        {isAdmin && <a href="/admin" className="hover:text-amber-600 transition">Админ</a>}
        <span className="hidden sm:inline">{email}</span>
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
      toast.success("Код отправлен!");
    } catch { toast.error("Ошибка"); }
    finally { setLoading(false); }
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
      if (!res.ok || !data.token) throw new Error(data.error);
      toast.success("Добро пожаловать!");
      const cookieRes = await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.token }),
      });
      if (!cookieRes.ok) throw new Error("Cookie failed");
      window.location.href = "/";
    } catch (e: any) { toast.error(e.message || "Неверный код"); }
    finally { setLoading(false); }
  }

  function closeModal() { setOpen(false); setStep("email"); setCode(""); setInputEmail(""); }

  const modal = open && mounted ? createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={closeModal}>
      <div className="glass neon-border card-glow w-full max-w-sm rounded-3xl p-8 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Вход в ClipForge</h2>
        </div>
        {step === "email" ? (
          <div className="space-y-4">
            <input type="email" placeholder="your@email.com" value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
            <button onClick={handleSendCode} disabled={loading || !inputEmail} className="btn-primary w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-50">
              {loading ? "Отправка..." : "Получить код"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">Код отправлен на <span className="text-zinc-800">{inputEmail}</span></p>
            <input type="text" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-center text-3xl tracking-[0.4em] font-mono text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" maxLength={6} autoFocus />
            <button onClick={handleVerify} disabled={loading || code.length < 4} className="btn-primary w-full rounded-xl py-3.5 font-bold text-white disabled:opacity-50">
              {loading ? "Проверка..." : "Войти"}
            </button>
            <button onClick={() => { setStep("email"); setCode(""); }} className="flex items-center justify-center gap-1.5 w-full text-sm text-zinc-400 hover:text-zinc-700 transition">
              Другой email
            </button>
          </div>
        )}
        <button onClick={closeModal} className="mt-4 w-full text-sm text-zinc-400 hover:text-zinc-600 transition">Закрыть</button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary rounded-xl px-5 py-2.5 font-medium text-white">
        Войти
      </button>
      {modal}
    </>
  );
}
