import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import { AuthButton } from "@/components/AuthButton";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "ClipForge — нарезка видео на shorts",
  description: "Загрузите видео, нарежьте на короткие клипы и опубликуйте в соцсети",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="ru" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col text-zinc-100 antialiased">
        <div className="bg-animated" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <Toaster position="top-right" toastOptions={{
          style: { background: "rgba(15,12,30,0.9)", color: "#e4e4e7", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" },
        }} />

        <nav className="sticky top-0 z-50 glass border-b border-white/5">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/25">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span className="text-xl font-bold gradient-text">ClipForge</span>
            </Link>
            <div className="flex items-center gap-1 text-sm">
              <Link href="/" className="rounded-lg px-4 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-white">Мои видео</Link>
              <Link href="/pricing" className="rounded-lg px-4 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-white">Тарифы</Link>
              <Link href="/settings" className="rounded-lg px-4 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-white">Настройки</Link>
              <div className="ml-2">
                <AuthButton email={user.email} kind={user.kind} />
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-600">
          <div className="mx-auto max-w-7xl px-6">
            <span className="gradient-text font-medium">ClipForge</span> — нарезка видео на shorts
          </div>
        </footer>
      </body>
    </html>
  );
}
