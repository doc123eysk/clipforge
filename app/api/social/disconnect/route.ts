import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { provider } = await req.json();
  if (!provider) return NextResponse.json({ error: "Missing provider" }, { status: 400 });

  await prisma.socialConnection.deleteMany({
    where: { userId: user.id, provider },
  });

  return NextResponse.json({ ok: true });
}
