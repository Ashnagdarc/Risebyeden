import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string[];
  subject: string;
  html: string;
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendConsultationEmail(payload: EmailPayload) {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured' };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';
  if (!from) {
    return { sent: false, reason: 'Missing sender address' };
  }

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });

  return { sent: true };
}

type InterestAssignmentPayload = {
  to: string[];
  agentName: string;
  clientName: string;
  clientUserId: string;
  propertyName: string;
  requestedAt: Date;
  dashboardUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendInterestAssignmentEmail(payload: InterestAssignmentPayload) {
  const requestedAtLabel = escapeHtml(payload.requestedAt.toLocaleString());
  const clientName = escapeHtml(payload.clientName);
  const clientUserId = escapeHtml(payload.clientUserId);
  const propertyName = escapeHtml(payload.propertyName);
  const agentName = escapeHtml(payload.agentName);
  const dashboardUrl = escapeHtml(payload.dashboardUrl);

  return sendConsultationEmail({
    to: payload.to,
    subject: `New client lead assigned: ${propertyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>New Interest Request Assigned</h2>
        <p>Hello ${agentName},</p>
        <p>You have been assigned a new client interest request. Please reach out to the client as soon as possible.</p>
        <p><strong>Client:</strong> ${clientName} (${clientUserId})</p>
        <p><strong>Property:</strong> ${propertyName}</p>
        <p><strong>Requested At:</strong> ${requestedAtLabel}</p>
        <p><a href="${dashboardUrl}">Open Agent Dashboard</a></p>
      </div>
    `,
  });
}
