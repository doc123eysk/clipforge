import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (email && code) {
      const authCode = await prisma.authCode.findFirst({
        where: { email, code, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });
      if (!authCode) {
        return NextResponse.json({ error: "Неверный код" }, { status: 401 });
      }

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({ data: { email, kind: "registered" } });
      } else if (user.kind === "guest") {
        user = await prisma.user.update({ where: { id: user.id }, data: { kind: "registered" } });
      }

      await prisma.authCode.deleteMany({ where: { email } });
      const token = signToken({ userId: user.id });
      return NextResponse.json({ ok: true, token });
    }

    if (email) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await prisma.authCode.create({
        data: { email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      });

      try {
        await sendMail({
          to: email,
          subject: "ClipForge — код для входа",
          html: `<div style="font-family:sans-serif;max-width:400px;margin:40px auto;padding:40px 20px;background:#0f0c1e;color:#e4e4e7;border-radius:16px">
            <h2 style="color:#818cf8;margin:0 0 8px">ClipForge</h2>
            <p style="color:#71717a;margin:0 0 24px;font-size:14px">Код для входа:</p>
            <div style="text-align:center;padding:20px;background:rgba(129,140,248,0.08);border-radius:12px;border:1px solid rgba(129,140,248,0.2);margin-bottom:24px">
              <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#e4e4e7">${code}</span>
            </div>
            <p style="color:#52525b;font-size:12px;margin:0">Действует 10 минут.</p>
          </div>`,
        });
      } catch (e: any) {
        console.error("[AUTH] SMTP error:", e.message);
      }

      console.log(`[AUTH] Code for ${email}: ${code}`);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Email required" }, { status: 400 });
  } catch (err: any) {
    console.error("[AUTH] Error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
