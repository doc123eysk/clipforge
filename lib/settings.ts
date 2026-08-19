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
  s3: {
    endpoint: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    region: string;
    enabled: boolean;
  };
  ykassa: {
    shopId: string;
    secretKey: string;
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
}

const DEFAULTS: AppSettings = {
  smtp: { host: "", port: "465", user: "", password: "", from: "", enabled: false },
  s3: { endpoint: "https://storage.yandexcloud.net", bucket: "", accessKey: "", secretKey: "", region: "ru-central1", enabled: false },
  ykassa: { shopId: "", secretKey: "", enabled: false },
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
    s3: { ...current.s3, ...settings.s3 },
    ykassa: { ...current.ykassa, ...settings.ykassa },
    limits: { ...current.limits, ...settings.limits },
    pricing: { ...current.pricing, ...settings.pricing },
    general: { ...current.general, ...settings.general },
  };
  await writeFile(SETTINGS_PATH, JSON.stringify(merged, null, 2));
}
