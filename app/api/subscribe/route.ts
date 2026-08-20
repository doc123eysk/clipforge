import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { createPayment } from "@/lib/yookassa";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { months = 1 } = body;

  const settings = await getSettings();
  const { yandexKassa, pricing } = settings;

  if (!yandexKassa.enabled || !yandexKassa.shopId || !yandexKassa.secretKey) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
  }

  let price = pricing.monthlyPrice;
  if (months === 3) price = Math.round(price * 3 * (1 - pricing.quarterlyDiscount / 100));
  else if (months === 6) price = Math.round(price * 6 * (1 - pricing.halfyearDiscount / 100));
  else if (months === 12) price = Math.round(price * 12 * (1 - pricing.yearlyDiscount / 100));
  else price = price * months;

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://clip-forge.ru";

  try {
    const payment = await createPayment({
      amount: price,
      description: `ClipForge PRO — ${months} мес.`,
      userId: user.id,
      months,
      returnUrl: `${origin}/pricing?paid=1`,
    });

    if (!payment.confirmation?.confirmation_url) {
      return NextResponse.json({ error: "No confirmation URL" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      confirmationUrl: payment.confirmation.confirmation_url,
    });
  } catch (err: any) {
    console.error("[Subscribe] Error:", err.message);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
