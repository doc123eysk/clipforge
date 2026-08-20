import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { verifyWebhookSignature } from "@/lib/yookassa";

export async function POST(req: Request) {
  const body = await req.text();
  const settings = await getSettings();
  const { shopId, secretKey } = settings.yandexKassa;

  if (!secretKey) {
    console.error("[Webhook] No secret key configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const signatureHeader = req.headers.get("signature") || "";
  const shopIdHeader = req.headers.get("x-shop-id") || "";

  if (shopId && shopIdHeader && shopId !== shopIdHeader) {
    console.error("[Webhook] Shop ID mismatch:", shopIdHeader);
    return NextResponse.json({ error: "Shop ID mismatch" }, { status: 400 });
  }

  if (signatureHeader) {
    const url = new URL(req.url);
    const requestUrl = url.pathname;
    const isValid = verifyWebhookSignature(secretKey, body, signatureHeader, shopId || shopIdHeader, "POST", requestUrl);
    if (!isValid) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  let notification;
  try {
    notification = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = notification.event;
  const payment = notification.object;

  if (!event || !payment) {
    return NextResponse.json({ ok: true });
  }

  console.log("[Webhook] Event:", event, "Payment ID:", payment.id, "Status:", payment.status);

  if (event === "payment.succeeded" && payment.status === "succeeded") {
    const userId = payment.metadata?.userId;
    const months = parseInt(payment.metadata?.months || "1", 10);

    if (!userId) {
      console.error("[Webhook] No userId in metadata");
      return NextResponse.json({ ok: true });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    await prisma.subscription.upsert({
      where: { userId },
      update: { plan: "pro", months, expiresAt },
      create: { userId, plan: "pro", months, expiresAt },
    });

    console.log("[Webhook] Subscription activated for user:", userId, "months:", months);
  }

  return NextResponse.json({ ok: true });
}
