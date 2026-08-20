import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const SETTINGS_PATH = join(process.cwd(), "storage", "settings.json");

export interface AppSettings {
  smtp: {
    host: string;
    port: string;
    user: string;
    password: string;
    from: string;
    enabled: boolean;
  };
  limits: {
    maxVideoDurationFree: number;
    maxVideoDurationPro: number;
    maxClipDuration: number;
    maxClipsPerVideoFree: number;
    maxClipsPerVideoPro: number;
    guestDailyLimit: number;
    guestVideoExpiryHours: number;
  };
  pricing: {
    monthlyPrice: number;
    quarterlyDiscount: number;
    halfyearDiscount: number;
    yearlyDiscount: number;
    promoCode: string;
    promoDiscount: number;
    promoEnabled: boolean;
  };
  general: {
    siteName: string;
    supportEmail: string;
    maintenance: boolean;
  };
  yandexKassa: {
    shopId: string;
    secretKey: string;
    enabled: boolean;
  };
  s3: {
    endpoint: string;
    bucket: string;
    region: string;
    accessKey: string;
    secretKey: string;
    publicUrl: string;
    enabled: boolean;
  };
}

const DEFAULTS: AppSettings = {
  smtp: { host: "", port: "465", user: "", password: "", from: "", enabled: false },
  limits: {
    maxVideoDurationFree: 600,
    maxVideoDurationPro: 7200,
    maxClipDuration: 60,
    maxClipsPerVideoFree: 6,
    maxClipsPerVideoPro: 50,
    guestDailyLimit: 6,
    guestVideoExpiryHours: 1,
  },
  pricing: {
    monthlyPrice: 399,
    quarterlyDiscount: 10,
    halfyearDiscount: 15,
    yearlyDiscount: 30,
    promoCode: "",
    promoDiscount: 0,
    promoEnabled: false,
  },
  general: { siteName: "ClipForge", supportEmail: "", maintenance: false },
  yandexKassa: { shopId: "", secretKey: "", enabled: false },
  s3: { endpoint: "", bucket: "", region: "ru-msk", accessKey: "", secretKey: "", publicUrl: "", enabled: false },
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await readFile(SETTINGS_PATH, "utf-8");
    return { ...DEFAULTS, ...JSON.parse(data) };
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  await mkdir(join(process.cwd(), "storage"), { recursive: true });
  const current = await getSettings();
  const merged = {
    smtp: { ...current.smtp, ...settings.smtp },
    limits: { ...current.limits, ...settings.limits },
    pricing: { ...current.pricing, ...settings.pricing },
    general: { ...current.general, ...settings.general },
    yandexKassa: { ...current.yandexKassa, ...settings.yandexKassa },
    s3: { ...current.s3, ...settings.s3 },
  };
  await writeFile(SETTINGS_PATH, JSON.stringify(merged, null, 2));
}
