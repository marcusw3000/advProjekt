import { Resend } from "resend";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let resend: Resend | null = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const client = getResendClient();
  if (!client) return;

  await client.emails.send({
    from: process.env.EMAIL_FROM ?? "no-reply@resend.dev",
    to,
    subject: "Redefinir sua senha",
    html: `
      <p>Recebemos um pedido para redefinir sua senha.</p>
      <p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a></p>
      <p>O link expira em 1 hora. Se você não pediu isso, ignore este email.</p>
    `,
  });
}

export async function sendJobFailedEmail(to: string[], videoTitle: string) {
  const client = getResendClient();
  if (!client || to.length === 0) return;

  await client.emails.send({
    from: process.env.EMAIL_FROM ?? "no-reply@resend.dev",
    to,
    subject: `Falha ao transcrever "${videoTitle}"`,
    html: `
      <p>Não conseguimos transcrever o vídeo <strong>${escapeHtml(videoTitle)}</strong> após várias tentativas.</p>
      <p>Nenhum minuto foi debitado do seu saldo. Tente reenviar o arquivo ou entre em contato com o suporte se o problema persistir.</p>
    `,
  });
}

export async function sendSupportTicketEmail(to: string[], subject: string, message: string, fromUserEmail: string) {
  const client = getResendClient();
  if (!client || to.length === 0) return;

  await client.emails.send({
    from: process.env.EMAIL_FROM ?? "no-reply@resend.dev",
    to,
    subject: `Novo ticket de suporte: ${subject}`,
    html: `
      <p><strong>De:</strong> ${escapeHtml(fromUserEmail)}</p>
      <p><strong>Assunto:</strong> ${escapeHtml(subject)}</p>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    `,
  });
}
