import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { months = 1 } = body;

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: { plan: "pro", months, expiresAt },
    create: { userId: user.id, plan: "pro", months, expiresAt },
  });

  return NextResponse.json({ ok: true, expiresAt });
}
