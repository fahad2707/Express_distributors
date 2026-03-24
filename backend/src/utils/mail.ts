import nodemailer from 'nodemailer';

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

export function isSmtpConfigured(): boolean {
  return smtpConfigured();
}

function createTransporter() {
  if (!smtpConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const t = createTransporter();
  if (!t) return;
  const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const link = `${base}/verify-email?token=${encodeURIComponent(token)}`;
  await t.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Verify your email',
    text: `Verify your account: ${link}\nThis link expires in 24 hours.`,
    html: `<p>Verify your account:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const t = createTransporter();
  if (!t) return;
  const base = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const link = `${base}/reset-password?token=${encodeURIComponent(token)}`;
  await t.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Reset your password',
    text: `Reset your password: ${link}\nThis link expires in 1 hour.`,
    html: `<p>Reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`,
  });
}
