import nodemailer from "nodemailer";
import { getSettings } from "./settings";

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const settings = await getSettings();
  const { smtp } = settings;

  if (!smtp.enabled || !smtp.host || !smtp.user) {
    console.log(`[MAIL] SMTP disabled`);
    return { ok: false, reason: "smtp_disabled" };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port) || 465,
    secure: Number(smtp.port) === 465,
    auth: { user: smtp.user, pass: smtp.password },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
  });

  const info = await transporter.sendMail({
    from: smtp.from || smtp.user,
    to,
    subject,
    html,
  });

  console.log(`[MAIL] Sent to ${to}, messageId: ${info.messageId}`);
  return { ok: true };
}
