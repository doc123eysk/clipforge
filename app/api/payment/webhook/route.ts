import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export async function POST(req: Request) {
  const body = await req.text();
  const settings = await getSettings();
  const { secretKey } = settings.yandexKassa;

  console.log("[Webhook] Received. Headers:", JSON.stringify(Object.fromEntries(req.headers)));

  if (!secretKey) {
    console.error("[Webhook] No secret key configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let notification;
  try {
    notification = JSON.parse(body);
  } catch {
    console.error("[Webhook] Invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = notification.event;
  const payment = notification.object;

  console.log("[Webhook] Event:", event, "Payment ID:", payment?.id, "Status:", payment?.status, "Metadata:", JSON.stringify(payment?.metadata));

  if (event === "payment.succeeded" && payment?.status === "succeeded") {
    const userId = payment.metadata?.userId;
    const months = parseInt(payment.metadata?.months || "1", 10);

    if (!userId) {
      console.error("[Webhook] No userId in metadata:", payment.metadata);
      return NextResponse.json({ ok: true });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    await prisma.subscription.upsert({
      where: { userId },
      update: { plan: "pro", months, expiresAt },
      create: { userId, plan: "pro", months, expiresAt },
    });

    console.log("[Webhook] Subscription ACTIVATED for user:", userId, "months:", months);
  }

  return NextResponse.json({ ok: true });
}
