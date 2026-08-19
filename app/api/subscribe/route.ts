import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRenewDate } from "@/lib/pricing";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { months } = await req.json();
  if (![1, 3, 6, 12].includes(months)) {
    return NextResponse.json({ error: "Invalid months" }, { status: 400 });
  }

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: { plan: "pro", months, expiresAt: getRenewDate(months) },
    create: { userId: user.id, plan: "pro", months, expiresAt: getRenewDate(months) },
  });

  return NextResponse.json({ ok: true });
}
