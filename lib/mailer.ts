import nodemailer from "nodemailer";
import { getSettings } from "./settings";

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const { smtp } = await getSettings();
  if (!smtp.enabled || !smtp.host || !smtp.user) {
    console.log(`[MAIL] SMTP disabled`);
    return { ok: false };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port) || 465,
    secure: Number(smtp.port) === 465,
    auth: { user: smtp.user, pass: smtp.password },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
  });

  await transporter.sendMail({
    from: smtp.from || smtp.user,
    to,
    subject,
    html,
  });

  return { ok: true };
}
