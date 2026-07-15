import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Cria o transporte SMTP apenas se as credenciais estiverem definidas.
// Funciona com Gmail, Brevo, Mailtrap, etc. — basta preencher as variáveis SMTP_*.
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = SSL; 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

export const isEmailConfigured = () => !!transporter;

/**
 * Envia um email. Lança erro se o SMTP não estiver configurado.
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!transporter) throw new Error('SMTP não está configurado');
  const from = process.env.SMTP_FROM || `Armazém Express <${process.env.SMTP_USER}>`;
  return transporter.sendMail({ from, to, subject, html, text });
}

/**
 * Template do email de recuperação de palavra-passe.
 */
export function passwordResetEmail(resetUrl) {
  const text = `Recebemos um pedido para redefinir a sua palavra-passe.\n\nAbra este link (válido durante 1 hora):\n${resetUrl}\n\nSe não foi você, ignore este email.`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <h2 style="color:#e11d2a;margin:0 0 8px">Armazém Express</h2>
    <p>Recebemos um pedido para <strong>redefinir a sua palavra-passe</strong>.</p>
    <p>Clique no botão abaixo (o link é válido durante <strong>1 hora</strong>):</p>
    <p style="text-align:center;margin:28px 0">
      <a href="${resetUrl}" style="background:#e11d2a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;display:inline-block">Redefinir palavra-passe</a>
    </p>
    <p style="font-size:13px;color:#64748b">Se o botão não funcionar, copie este endereço:<br><a href="${resetUrl}">${resetUrl}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:12px;color:#94a3b8">Se não pediu esta alteração, ignore este email — a sua palavra-passe continua igual.</p>
  </div>`;
  return { subject: 'Recuperação de palavra-passe · Armazém Express', text, html };
}
