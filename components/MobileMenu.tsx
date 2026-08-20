"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";

interface Props {
  email: string | null;
  kind: string;
}

export function MobileMenu({ email, kind }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-black/5 hover:text-zinc-900 transition" aria-label="Меню">
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        )}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-50 glass border-b border-black/5 animate-slide-up" style={{ animationDuration: "0.2s" }}>
          <div className="flex flex-col gap-1 px-4 py-4 text-sm">
            <Link href="/" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-zinc-500 transition hover:bg-black/5 hover:text-zinc-900">Мои видео</Link>
            <Link href="/schedule" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-zinc-500 transition hover:bg-black/5 hover:text-zinc-900">Расписание</Link>
            <Link href="/pricing" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-zinc-500 transition hover:bg-black/5 hover:text-zinc-900">Тарифы</Link>
            <Link href="/settings" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-zinc-500 transition hover:bg-black/5 hover:text-zinc-900">Настройки</Link>
            <div className="mt-2 border-t border-black/5 pt-3">
              <AuthButton email={email} kind={kind} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
