"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Settings {
  smtp: { host: string; port: string; user: string; password: string; from: string; enabled: boolean };
  limits: { maxVideoDurationFree: number; maxVideoDurationPro: number; maxClipDuration: number; maxClipsPerVideoFree: number; maxClipsPerVideoPro: number; guestDailyLimit: number; guestVideoExpiryHours: number };
  pricing: { monthlyPrice: number; quarterlyDiscount: number; halfyearDiscount: number; yearlyDiscount: number; promoCode: string; promoDiscount: number; promoEnabled: boolean };
  general: { siteName: string; supportEmail: string; maintenance: boolean };
  yandexKassa: { shopId: string; secretKey: string; enabled: boolean };
  s3: { endpoint: string; bucket: string; region: string; accessKey: string; secretKey: string; publicUrl: string; enabled: boolean };
  legal: { entityType: string; fullName: string; inn: string; ogrn: string; legalAddress: string; actualAddress: string; phone: string; email: string; bankName: string; bik: string; corrAccount: string; bankAccount: string };
  social: { vkAppId: string; vkSecret: string; vkEnabled: boolean; youtubeClientId: string; youtubeClientSecret: string; youtubeEnabled: boolean; tiktokClientId: string; tiktokClientSecret: string; tiktokEnabled: boolean; instagramClientId: string; instagramClientSecret: string; instagramEnabled: boolean };
}

const DEFAULTS: Settings = {
  smtp: { host: "", port: "465", user: "", password: "", from: "", enabled: false },
  limits: { maxVideoDurationFree: 600, maxVideoDurationPro: 7200, maxClipDuration: 180, maxClipsPerVideoFree: 6, maxClipsPerVideoPro: 50, guestDailyLimit: 6, guestVideoExpiryHours: 1 },
  pricing: { monthlyPrice: 399, quarterlyDiscount: 10, halfyearDiscount: 15, yearlyDiscount: 30, promoCode: "", promoDiscount: 0, promoEnabled: false },
  general: { siteName: "ClipForge", supportEmail: "", maintenance: false },
  yandexKassa: { shopId: "", secretKey: "", enabled: false },
  s3: { endpoint: "", bucket: "", region: "ru-msk", accessKey: "", secretKey: "", publicUrl: "", enabled: false },
  legal: { entityType: "Индивидуальный предприниматель", fullName: "", inn: "", ogrn: "", legalAddress: "", actualAddress: "", phone: "", email: "", bankName: "", bik: "", corrAccount: "", bankAccount: "" },
  social: { vkAppId: "", vkSecret: "", vkEnabled: false, youtubeClientId: "", youtubeClientSecret: "", youtubeEnabled: false, tiktokClientId: "", tiktokClientSecret: "", tiktokEnabled: false, instagramClientId: "", instagramClientSecret: "", instagramEnabled: false },
};

function Field({ label, value, onChange, type = "text", placeholder, secret }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; secret?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-500">{label}</label>
      <input type={secret && !show ? "password" : type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 bg-white px-3 sm:px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
      {secret && <button onClick={() => setShow(!show)} className="mt-1 text-xs text-zinc-400 hover:text-zinc-700">{show ? "Скрыть" : "Показать"}</button>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-indigo-500" : "bg-zinc-300"}`} onClick={() => onChange(!checked)}>
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition shadow-sm ${checked ? "left-5" : "left-0.5"}`} />
      </div>
      <span className="text-sm text-zinc-700">{label}</span>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-6">
      <h2 className="mb-4 sm:mb-5 text-base sm:text-lg font-semibold text-zinc-800">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/admin/settings").then((r) => r.json()).then(setSettings).catch(() => {}).finally(() => setLoading(false)); }, []);

  function update<K extends keyof Settings>(section: K, key: keyof Settings[K], value: any) {
    setSettings((s) => ({ ...s, [section]: { ...s[section], [key]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      if (!res.ok) throw new Error();
      toast.success("Сохранено!");
    } catch { toast.error("Ошибка"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"><animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" /></circle></svg></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <h1 className="text-2xl sm:text-4xl font-bold"><span className="gradient-text">Настройки</span></h1>
        <div className="flex gap-2">
          <Link href="/admin" className="rounded-xl border border-black/10 bg-black/5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 transition">Дашборд</Link>
          <Link href="/admin/settings" className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-700">Настройки</Link>
        </div>
      </div>
      <div className="space-y-4 sm:space-y-6">
        <Section title="Общие">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название" value={settings.general.siteName} onChange={(v) => update("general", "siteName", v)} />
            <Field label="Email поддержки" value={settings.general.supportEmail} onChange={(v) => update("general", "supportEmail", v)} type="email" />
          </div>
          <Toggle label="Обслуживание" checked={settings.general.maintenance} onChange={(v) => update("general", "maintenance", v)} />
        </Section>

        <Section title="SMTP">
          <Toggle label="Включён" checked={settings.smtp.enabled} onChange={(v) => update("smtp", "enabled", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Хост" value={settings.smtp.host} onChange={(v) => update("smtp", "host", v)} placeholder="smtp.mail.ru" />
            <Field label="Порт" value={settings.smtp.port} onChange={(v) => update("smtp", "port", v)} />
            <Field label="Пользователь" value={settings.smtp.user} onChange={(v) => update("smtp", "user", v)} />
            <Field label="Пароль" value={settings.smtp.password} onChange={(v) => update("smtp", "password", v)} secret />
            <Field label="От кого" value={settings.smtp.from} onChange={(v) => update("smtp", "from", v)} />
          </div>
        </Section>

        <Section title="Лимиты">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Видео Free (сек)" value={String(settings.limits.maxVideoDurationFree)} onChange={(v) => update("limits", "maxVideoDurationFree", Number(v))} type="number" />
            <Field label="Видео PRO (сек)" value={String(settings.limits.maxVideoDurationPro)} onChange={(v) => update("limits", "maxVideoDurationPro", Number(v))} type="number" />
            <Field label="Клип макс (сек)" value={String(settings.limits.maxClipDuration)} onChange={(v) => update("limits", "maxClipDuration", Number(v))} type="number" />
            <Field label="Клипов Free" value={String(settings.limits.maxClipsPerVideoFree)} onChange={(v) => update("limits", "maxClipsPerVideoFree", Number(v))} type="number" />
            <Field label="Клипов PRO" value={String(settings.limits.maxClipsPerVideoPro)} onChange={(v) => update("limits", "maxClipsPerVideoPro", Number(v))} type="number" />
            <Field label="Гости/день" value={String(settings.limits.guestDailyLimit)} onChange={(v) => update("limits", "guestDailyLimit", Number(v))} type="number" />
            <Field label="Хранение гостей (час)" value={String(settings.limits.guestVideoExpiryHours)} onChange={(v) => update("limits", "guestVideoExpiryHours", Number(v))} type="number" />
          </div>
        </Section>

        <Section title="Цены и скидки">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="PRO цена/мес (₽)" value={String(settings.pricing.monthlyPrice)} onChange={(v) => update("pricing", "monthlyPrice", Number(v))} type="number" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="3 мес скидка %" value={String(settings.pricing.quarterlyDiscount)} onChange={(v) => update("pricing", "quarterlyDiscount", Number(v))} type="number" />
            <Field label="6 мес скидка %" value={String(settings.pricing.halfyearDiscount)} onChange={(v) => update("pricing", "halfyearDiscount", Number(v))} type="number" />
            <Field label="12 мес скидка %" value={String(settings.pricing.yearlyDiscount)} onChange={(v) => update("pricing", "yearlyDiscount", Number(v))} type="number" />
          </div>
          <Toggle label="Промокод" checked={settings.pricing.promoEnabled} onChange={(v) => update("pricing", "promoEnabled", v)} />
          {settings.pricing.promoEnabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Код" value={settings.pricing.promoCode} onChange={(v) => update("pricing", "promoCode", v)} placeholder="SALE20" />
              <Field label="Скидка %" value={String(settings.pricing.promoDiscount)} onChange={(v) => update("pricing", "promoDiscount", Number(v))} type="number" />
            </div>
          )}
        </Section>

        <Section title="Яндекс Касса">
          <Toggle label="Включена" checked={settings.yandexKassa.enabled} onChange={(v) => update("yandexKassa", "enabled", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shop ID" value={settings.yandexKassa.shopId} onChange={(v) => update("yandexKassa", "shopId", v)} placeholder="123456" />
            <Field label="Секретный ключ" value={settings.yandexKassa.secretKey} onChange={(v) => update("yandexKassa", "secretKey", v)} secret placeholder="live_..." />
          </div>
        </Section>

        <Section title="S3 хранилище">
          <Toggle label="Включено" checked={settings.s3.enabled} onChange={(v) => update("s3", "enabled", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Endpoint" value={settings.s3.endpoint} onChange={(v) => update("s3", "endpoint", v)} placeholder="https://s3.elitecloud.ru" />
            <Field label="Bucket" value={settings.s3.bucket} onChange={(v) => update("s3", "bucket", v)} placeholder="clipforge" />
            <Field label="Region" value={settings.s3.region} onChange={(v) => update("s3", "region", v)} placeholder="ru-msk" />
            <Field label="Public URL" value={settings.s3.publicUrl} onChange={(v) => update("s3", "publicUrl", v)} placeholder="https://cdn.clipforge.ru" />
            <Field label="Access Key" value={settings.s3.accessKey} onChange={(v) => update("s3", "accessKey", v)} secret />
            <Field label="Secret Key" value={settings.s3.secretKey} onChange={(v) => update("s3", "secretKey", v)} secret />
          </div>
        </Section>

        <Section title="Реквизиты (для Яндекс Кассы)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Тип лица" value={settings.legal.entityType} onChange={(v) => update("legal", "entityType", v)} placeholder="ИП / ООО / Самозанятый" />
            <Field label="ФИО / Название" value={settings.legal.fullName} onChange={(v) => update("legal", "fullName", v)} placeholder="Иванов Иван Иванович" />
            <Field label="ИНН" value={settings.legal.inn} onChange={(v) => update("legal", "inn", v)} placeholder="123456789012" />
            <Field label="ОГРН / ОГРНИП" value={settings.legal.ogrn} onChange={(v) => update("legal", "ogrn", v)} placeholder="123456789012345" />
            <Field label="Телефон" value={settings.legal.phone} onChange={(v) => update("legal", "phone", v)} placeholder="+7 900 123-45-67" />
            <Field label="Email" value={settings.legal.email} onChange={(v) => update("legal", "email", v)} type="email" />
          </div>
          <Field label="Юридический адрес" value={settings.legal.legalAddress} onChange={(v) => update("legal", "legalAddress", v)} placeholder="г. Москва, ул. Примерная, д. 1" />
          <Field label="Фактический адрес" value={settings.legal.actualAddress} onChange={(v) => update("legal", "actualAddress", v)} placeholder="г. Москва, ул. Примерная, д. 1" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Банк" value={settings.legal.bankName} onChange={(v) => update("legal", "bankName", v)} placeholder="ПАО Сбербанк" />
            <Field label="БИК" value={settings.legal.bik} onChange={(v) => update("legal", "bik", v)} placeholder="044525225" />
            <Field label="Корр. счёт" value={settings.legal.corrAccount} onChange={(v) => update("legal", "corrAccount", v)} placeholder="30101810400000000225" />
            <Field label="Расчётный счёт" value={settings.legal.bankAccount} onChange={(v) => update("legal", "bankAccount", v)} placeholder="40802810100000000001" />
          </div>
        </Section>

        <Section title="Социальные сети (OAuth)">
          <p className="text-xs text-zinc-400 mb-2">Callback URL для всех: <code className="text-indigo-600">https://clip-forge.ru/api/social/{'{provider}'}/callback</code></p>

          <Toggle label="VK" checked={settings.social.vkEnabled} onChange={(v) => update("social", "vkEnabled", v)} />
          {settings.social.vkEnabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="App ID" value={settings.social.vkAppId} onChange={(v) => update("social", "vkAppId", v)} placeholder="51234567" />
              <Field label="App Secret" value={settings.social.vkSecret} onChange={(v) => update("social", "vkSecret", v)} secret />
            </div>
          )}

          <div className="border-t border-black/5 pt-4 mt-2" />
          <Toggle label="YouTube" checked={settings.social.youtubeEnabled} onChange={(v) => update("social", "youtubeEnabled", v)} />
          {settings.social.youtubeEnabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client ID" value={settings.social.youtubeClientId} onChange={(v) => update("social", "youtubeClientId", v)} />
              <Field label="Client Secret" value={settings.social.youtubeClientSecret} onChange={(v) => update("social", "youtubeClientSecret", v)} secret />
            </div>
          )}

          <div className="border-t border-black/5 pt-4 mt-2" />
          <Toggle label="TikTok" checked={settings.social.tiktokEnabled} onChange={(v) => update("social", "tiktokEnabled", v)} />
          {settings.social.tiktokEnabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client Key" value={settings.social.tiktokClientId} onChange={(v) => update("social", "tiktokClientId", v)} />
              <Field label="Client Secret" value={settings.social.tiktokClientSecret} onChange={(v) => update("social", "tiktokClientSecret", v)} secret />
            </div>
          )}

          <div className="border-t border-black/5 pt-4 mt-2" />
          <Toggle label="Instagram" checked={settings.social.instagramEnabled} onChange={(v) => update("social", "instagramEnabled", v)} />
          {settings.social.instagramEnabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client ID" value={settings.social.instagramClientId} onChange={(v) => update("social", "instagramClientId", v)} />
              <Field label="Client Secret" value={settings.social.instagramClientSecret} onChange={(v) => update("social", "instagramClientSecret", v)} secret />
            </div>
          )}
        </Section>
      </div>
      <div className="mt-6 sm:mt-8 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary rounded-xl px-6 sm:px-8 py-3 font-bold text-white disabled:opacity-50">
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
