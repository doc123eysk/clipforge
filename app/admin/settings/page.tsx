"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Settings {
  smtp: { host: string; port: string; user: string; password: string; from: string; enabled: boolean };
  s3: { endpoint: string; bucket: string; accessKey: string; secretKey: string; region: string; enabled: boolean };
  ykassa: { shopId: string; secretKey: string; enabled: boolean };
  limits: { maxVideoDurationFree: number; maxVideoDurationPro: number; maxClipDuration: number; maxClipsPerVideoFree: number; maxClipsPerVideoPro: number; guestDailyLimit: number; guestVideoExpiryHours: number };
  pricing: { monthlyPrice: number; quarterlyDiscount: number; halfyearDiscount: number; yearlyDiscount: number; promoCode: string; promoDiscount: number; promoEnabled: boolean };
  general: { siteName: string; supportEmail: string; maintenance: boolean };
}

const DEFAULTS: Settings = {
  smtp: { host: "", port: "465", user: "", password: "", from: "", enabled: false },
  s3: { endpoint: "https://storage.yandexcloud.net", bucket: "", accessKey: "", secretKey: "", region: "ru-central1", enabled: false },
  ykassa: { shopId: "", secretKey: "", enabled: false },
  limits: { maxVideoDurationFree: 600, maxVideoDurationPro: 7200, maxClipDuration: 60, maxClipsPerVideoFree: 6, maxClipsPerVideoPro: 50, guestDailyLimit: 6, guestVideoExpiryHours: 1 },
  pricing: { monthlyPrice: 399, quarterlyDiscount: 10, halfyearDiscount: 15, yearlyDiscount: 30, promoCode: "", promoDiscount: 0, promoEnabled: false },
  general: { siteName: "ClipForge", supportEmail: "", maintenance: false },
};

function Field({ label, value, onChange, type = "text", placeholder, secret }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; secret?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      <div className="relative">
        <input
          type={secret && !show ? "password" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        {secret && (
          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300">
            {show ? "Скрыть" : "Показать"}
          </button>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-indigo-500" : "bg-zinc-700"}`} onClick={() => onChange(!checked)}>
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-5.5" : "left-0.5"}`} />
      </div>
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass card-glow rounded-2xl p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-zinc-200">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof Settings>(section: K, key: keyof Settings[K], value: any) {
    setSettings((s) => ({ ...s, [section]: { ...s[section], [key]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success("Настройки сохранены!");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20">
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full badge px-4 py-1.5 text-xs font-medium text-indigo-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Настройки
          </div>
          <h1 className="text-4xl font-bold">
            <span className="gradient-text">Конфигурация</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/10 hover:text-white">
            Дашборд
          </Link>
          <Link href="/admin/settings" className="rounded-xl bg-indigo-500/20 border border-indigo-500/30 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/30">
            Настройки
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* General */}
        <Section title="Общие" icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m-7-3.5 5.196-3m5.196-3L17 2.5M5 2.5l5.196 3m5.196 3L17 17.5"/>
          </svg>
        }>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название сайта" value={settings.general.siteName} onChange={(v) => update("general", "siteName", v)} placeholder="ClipForge" />
            <Field label="Email поддержки" value={settings.general.supportEmail} onChange={(v) => update("general", "supportEmail", v)} placeholder="support@example.com" type="email" />
          </div>
          <Toggle label="Режим обслуживания" checked={settings.general.maintenance} onChange={(v) => update("general", "maintenance", v)} />
        </Section>

        {/* SMTP */}
        <Section title="SMTP (Email)" icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
        }>
          <Toggle label="Включён" checked={settings.smtp.enabled} onChange={(v) => update("smtp", "enabled", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SMTP хост" value={settings.smtp.host} onChange={(v) => update("smtp", "host", v)} placeholder="smtp.yandex.ru" />
            <Field label="Порт" value={settings.smtp.port} onChange={(v) => update("smtp", "port", v)} placeholder="465" />
            <Field label="Пользователь" value={settings.smtp.user} onChange={(v) => update("smtp", "user", v)} placeholder="your@yandex.ru" />
            <Field label="Пароль" value={settings.smtp.password} onChange={(v) => update("smtp", "password", v)} placeholder="••••••••" secret />
            <Field label="От кого" value={settings.smtp.from} onChange={(v) => update("smtp", "from", v)} placeholder="ClipForge <noreply@yandex.ru>" />
          </div>
        </Section>

        {/* S3 */}
        <Section title="S3 (Хранилище)" icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        }>
          <Toggle label="Включён" checked={settings.s3.enabled} onChange={(v) => update("s3", "enabled", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Endpoint" value={settings.s3.endpoint} onChange={(v) => update("s3", "endpoint", v)} placeholder="https://storage.yandexcloud.net" />
            <Field label="Bucket" value={settings.s3.bucket} onChange={(v) => update("s3", "bucket", v)} placeholder="my-bucket" />
            <Field label="Access Key" value={settings.s3.accessKey} onChange={(v) => update("s3", "accessKey", v)} placeholder="YC..." secret />
            <Field label="Secret Key" value={settings.s3.secretKey} onChange={(v) => update("s3", "secretKey", v)} placeholder="••••••••" secret />
            <Field label="Регион" value={settings.s3.region} onChange={(v) => update("s3", "region", v)} placeholder="ru-central1" />
          </div>
        </Section>

        {/* Yandex Kassa */}
        <Section title="Яндекс Касса" icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        }>
          <Toggle label="Включён" checked={settings.ykassa.enabled} onChange={(v) => update("ykassa", "enabled", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shop ID" value={settings.ykassa.shopId} onChange={(v) => update("ykassa", "shopId", v)} placeholder="123456" />
            <Field label="Secret Key" value={settings.ykassa.secretKey} onChange={(v) => update("ykassa", "secretKey", v)} placeholder="••••••••" secret />
          </div>
        </Section>

        {/* Limits */}
        <Section title="Лимиты" icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        }>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Видео Free (сек)" value={String(settings.limits.maxVideoDurationFree)} onChange={(v) => update("limits", "maxVideoDurationFree", Number(v))} type="number" />
            <Field label="Видео PRO (сек)" value={String(settings.limits.maxVideoDurationPro)} onChange={(v) => update("limits", "maxVideoDurationPro", Number(v))} type="number" />
            <Field label="Клип макс (сек)" value={String(settings.limits.maxClipDuration)} onChange={(v) => update("limits", "maxClipDuration", Number(v))} type="number" />
            <Field label="Клипов на видео Free" value={String(settings.limits.maxClipsPerVideoFree)} onChange={(v) => update("limits", "maxClipsPerVideoFree", Number(v))} type="number" />
            <Field label="Клипов на видео PRO" value={String(settings.limits.maxClipsPerVideoPro)} onChange={(v) => update("limits", "maxClipsPerVideoPro", Number(v))} type="number" />
            <Field label="Гости: лимит/день" value={String(settings.limits.guestDailyLimit)} onChange={(v) => update("limits", "guestDailyLimit", Number(v))} type="number" />
            <Field label="Гости: хранение (час)" value={String(settings.limits.guestVideoExpiryHours)} onChange={(v) => update("limits", "guestVideoExpiryHours", Number(v))} type="number" />
          </div>
        </Section>

        {/* Pricing & Discounts */}
        <Section title="Цены и скидки" icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        }>
          <div className="mb-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-4">
            <p className="text-xs text-zinc-400">Базовая цена PRO тарифа. Скидки рассчитываются автоматически.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="PRO цена / мес (₽)" value={String(settings.pricing.monthlyPrice)} onChange={(v) => update("pricing", "monthlyPrice", Number(v))} type="number" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="3 мес — скидка %" value={String(settings.pricing.quarterlyDiscount)} onChange={(v) => update("pricing", "quarterlyDiscount", Number(v))} type="number" />
            <Field label="6 мес — скидка %" value={String(settings.pricing.halfyearDiscount)} onChange={(v) => update("pricing", "halfyearDiscount", Number(v))} type="number" />
            <Field label="12 мес — скидка %" value={String(settings.pricing.yearlyDiscount)} onChange={(v) => update("pricing", "yearlyDiscount", Number(v))} type="number" />
          </div>
          <div className="my-2 border-t border-white/5" />
          <div className="mb-2 rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
            <p className="text-xs text-zinc-400">Промокод — дополнительная скидка поверх базовой. Вводится при покупке.</p>
          </div>
          <Toggle label="Промокод активен" checked={settings.pricing.promoEnabled} onChange={(v) => update("pricing", "promoEnabled", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Код промокода" value={settings.pricing.promoCode} onChange={(v) => update("pricing", "promoCode", v)} placeholder="SALE20" />
            <Field label="Скидка промокода %" value={String(settings.pricing.promoDiscount)} onChange={(v) => update("pricing", "promoDiscount", Number(v))} type="number" />
          </div>
          {settings.pricing.promoEnabled && settings.pricing.promoCode && (
            <div className="rounded-xl bg-white/[0.02] border border-amber-500/20 p-4">
              <p className="text-xs text-zinc-400">
                Превью: <span className="text-amber-300 font-mono">{settings.pricing.promoCode}</span> → <span className="text-amber-300">-{settings.pricing.promoDiscount}%</span> к любому тарифу
              </p>
              <p className="mt-1 text-[11px] text-zinc-600">
                3 мес: {Math.round(settings.pricing.monthlyPrice * 3 * (1 - settings.pricing.quarterlyDiscount / 100))} ₽ · 
                6 мес: {Math.round(settings.pricing.monthlyPrice * 6 * (1 - settings.pricing.halfyearDiscount / 100))} ₽ · 
                12 мес: {Math.round(settings.pricing.monthlyPrice * 12 * (1 - settings.pricing.yearlyDiscount / 100))} ₽
              </p>
            </div>
          )}
        </Section>

      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary rounded-xl px-8 py-3 font-bold text-white disabled:opacity-50"
        >
          <span>{saving ? "Сохранение..." : "Сохранить все настройки"}</span>
        </button>
      </div>
    </div>
  );
}
