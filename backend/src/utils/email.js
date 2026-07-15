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

/**
 * Template do email de confirmação de encomenda com link de rastreio.
 */
export function orderTrackingEmail(order, trackUrl) {
  const name = order.recipient_name || 'Cliente';
  const text = `Olá ${name},\n\nA sua encomenda foi registada.\nNúmero de rastreio: ${order.tracking_number}\n\nAcompanhe aqui:\n${trackUrl}\n\nObrigado — Armazém Express`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <h2 style="color:#e11d2a;margin:0 0 8px">Armazém Express</h2>
    <p>Olá <strong>${name}</strong>,</p>
    <p>A sua encomenda foi registada e está a ser preparada. 📦</p>
    <p style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;font-size:15px">
      Número de rastreio:<br><strong style="font-family:monospace;font-size:17px">${order.tracking_number}</strong>
    </p>
    <p style="text-align:center;margin:28px 0">
      <a href="${trackUrl}" style="background:#e11d2a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;display:inline-block">Acompanhar encomenda</a>
    </p>
    <p style="font-size:13px;color:#64748b">Se o botão não funcionar, copie este endereço:<br><a href="${trackUrl}">${trackUrl}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:12px;color:#94a3b8">Obrigado por comprar connosco — Armazém Express.</p>
  </div>`;
  return { subject: `A sua encomenda ${order.tracking_number} · Armazém Express`, text, html };
}

/**
 * Template do email de boas-vindas com as credenciais de acesso.
 */
export function welcomeCredentialsEmail({ email, password, companyName, planName, loginUrl }) {
  const text = `Bem-vindo ao Armazém Express, ${companyName}!\n\nA sua conta (plano ${planName}) está ativa.\n\nEmail: ${email}\nPalavra-passe: ${password}\n\nPor segurança, altere a palavra-passe após o primeiro acesso (Definições > Segurança).\n\nEntrar: ${loginUrl}`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <h2 style="color:#e11d2a;margin:0 0 8px">Armazém Express</h2>
    <p>Bem-vindo, <strong>${companyName}</strong>! 🎉</p>
    <p>A sua conta (plano <strong>${planName}</strong>) está ativa. Estas são as suas credenciais de acesso:</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;font-size:14px">
      <div>Email: <strong>${email}</strong></div>
      <div style="margin-top:6px">Palavra-passe: <strong style="font-family:monospace;font-size:16px">${password}</strong></div>
    </div>
    <p style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px 14px;font-size:13px;color:#9a3412">
      ⚠️ Por segurança, <strong>altere a palavra-passe</strong> após o primeiro acesso, em <strong>Definições &gt; Segurança</strong>.
    </p>
    <p style="text-align:center;margin:24px 0">
      <a href="${loginUrl}" style="background:#e11d2a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;display:inline-block">Entrar no painel</a>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:12px;color:#94a3b8">Guarde este email num local seguro. Armazém Express.</p>
  </div>`;
  return { subject: 'Bem-vindo ao Armazém Express — dados de acesso', text, html };
}
