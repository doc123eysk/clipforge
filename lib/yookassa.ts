import crypto from "crypto";
import { getSettings } from "./settings";

const YOOKASSA_API = "https://api.yookassa.ru/v3";

export interface YookassaPayment {
  id: string;
  status: string;
  confirmation?: { confirmation_url: string };
  amount: { value: string; currency: string };
  metadata?: Record<string, string>;
}

async function yookassaFetch(path: string, body: Record<string, unknown>): Promise<YookassaPayment> {
  const settings = await getSettings();
  const { shopId, secretKey } = settings.yandexKassa;
  if (!shopId || !secretKey) throw new Error("YooKassa not configured");

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  const res = await fetch(`${YOOKASSA_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      "Idempotence-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[YooKassa] API error:", res.status, err);
    throw new Error(`YooKassa API error: ${res.status}`);
  }

  return res.json() as Promise<YookassaPayment>;
}

export async function createPayment(opts: {
  amount: number;
  description: string;
  userId: string;
  months: number;
  returnUrl: string;
}): Promise<YookassaPayment> {
  return yookassaFetch("/payments", {
    amount: { value: opts.amount.toFixed(2), currency: "RUB" },
    capture: true,
    description: opts.description,
    confirmation: { type: "redirect", return_url: opts.returnUrl },
    metadata: { userId: opts.userId, months: String(opts.months) },
  });
}

export async function getPayment(paymentId: string): Promise<YookassaPayment> {
  const settings = await getSettings();
  const { shopId, secretKey } = settings.yandexKassa;
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString("base64");
  const res = await fetch(`${YOOKASSA_API}/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return res.json() as Promise<YookassaPayment>;
}

export function verifyWebhookSignature(
  secretKey: string,
  body: string,
  signatureHeader: string,
 shopId: string,
  httpMethod: string,
  requestUrl: string
): boolean {
  const [algo, signature] = signatureHeader.split("=");
  if (algo !== "sha256-hmac") return false;

  const stringToSign = `${httpMethod}\n${body}\n${shopId}\n${requestUrl}`;
  const expected = crypto.createHmac("sha256", secretKey).update(stringToSign).digest("hex");
  return signature === expected;
}
