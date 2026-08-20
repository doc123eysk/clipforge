import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function LegalPage() {
  const settings = await getSettings();
  const l = settings.legal;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold"><span className="gradient-text">Реквизиты</span></h1>

      <div className="glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 mb-3">Общая информация</h2>
          <div className="space-y-2 text-sm">
            <Row label="Наименование сервиса" value={settings.general.siteName || "ClipForge"} />
            <Row label="Тип лица" value={l.entityType || "—" } />
            <Row label="ФИО / Наименование" value={l.fullName || "—"} />
            <Row label="ИНН" value={l.inn || "—"} />
            <Row label="ОГРН / ОГРНИП" value={l.ogrn || "—"} />
          </div>
        </div>

        <div className="border-t border-black/5" />

        <div>
          <h2 className="text-sm font-semibold text-zinc-800 mb-3">Адреса</h2>
          <div className="space-y-2 text-sm">
            <Row label="Юридический адрес" value={l.legalAddress || "—"} />
            <Row label="Фактический адрес" value={l.actualAddress || "—"} />
          </div>
        </div>

        <div className="border-t border-black/5" />

        <div>
          <h2 className="text-sm font-semibold text-zinc-800 mb-3">Контакты</h2>
          <div className="space-y-2 text-sm">
            <Row label="Телефон" value={l.phone || "—"} />
            <Row label="Email" value={l.email || "—"} />
          </div>
        </div>

        <div className="border-t border-black/5" />

        <div>
          <h2 className="text-sm font-semibold text-zinc-800 mb-3">Банковские реквизиты</h2>
          <div className="space-y-2 text-sm">
            <Row label="Банк" value={l.bankName || "—"} />
            <Row label="БИК" value={l.bik || "—"} />
            <Row label="Корр. счёт" value={l.corrAccount || "—"} />
            <Row label="Расчётный счёт" value={l.bankAccount || "—"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-xl bg-black/[0.02] border border-black/5 px-3 sm:px-4 py-2.5">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-800 sm:text-right">{value}</span>
    </div>
  );
}
