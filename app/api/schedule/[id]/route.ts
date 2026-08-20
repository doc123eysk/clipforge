import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user.id) {
    return NextResponse.json({ error: "not_auth" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const pub = await prisma.publication.findUnique({ where: { id } });
  if (!pub || pub.userId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (pub.status !== "scheduled") {
    return NextResponse.json({ error: "cannot_edit" }, { status: 400 });
  }

  const updateData: any = {};
  if (body.scheduledAt) {
    updateData.scheduledAt = new Date(body.scheduledAt);
  }
  if (body.status === "cancelled") {
    updateData.status = "cancelled";
  }

  const updated = await prisma.publication.update({ where: { id }, data: updateData });
  return NextResponse.json({ ok: true, publication: updated });
}
