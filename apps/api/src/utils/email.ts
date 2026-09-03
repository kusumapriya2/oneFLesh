// ============================================================
// OneFlesh — Email Service (AWS SES)
// ============================================================

import { SendEmailCommand } from '@aws-sdk/client-ses';
import nodemailer from 'nodemailer';
import { sesClient, SES_FROM } from '../config/aws.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

  if (env.NODE_ENV === 'development' && !env.AWS_ACCESS_KEY_ID) {
    // Use Nodemailer SMTP in development (e.g., Mailhog)
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
    });
    await transporter.sendMail({
      from: SES_FROM,
      to: toAddresses.join(','),
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info(`[DEV] Email sent to ${toAddresses.join(', ')}: ${options.subject}`);
    return;
  }

  const command = new SendEmailCommand({
    Source: SES_FROM,
    Destination: { ToAddresses: toAddresses },
    Message: {
      Subject: { Data: options.subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: options.html, Charset: 'UTF-8' },
        ...(options.text ? { Text: { Data: options.text, Charset: 'UTF-8' } } : {}),
      },
    },
  });

  try {
    await sesClient.send(command);
    logger.info(`Email sent to ${toAddresses.join(', ')}: ${options.subject}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
}

// ─── Email Templates ──────────────────────────────────────────
const brandedTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Georgia', serif; background: #faf6f0; color: #3d1a1e; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff9f4; border: 1px solid rgba(107,15,26,0.12); border-radius: 8px; overflow: hidden; }
    .header { background: #4a0a12; padding: 28px 36px; text-align: center; }
    .logo { font-size: 22px; color: #e2c97e; letter-spacing: 0.04em; }
    .logo em { font-style: italic; font-weight: 300; }
    .body { padding: 32px 36px; }
    .footer { background: #4a0a12; padding: 16px 36px; text-align: center; font-size: 11px; color: rgba(250,246,240,0.45); }
    .btn { display: inline-block; background: #c9a84c; color: #4a0a12; padding: 12px 28px; text-decoration: none; border-radius: 3px; font-weight: 600; letter-spacing: 0.08em; margin: 16px 0; }
    h2 { color: #4a0a12; font-size: 22px; font-weight: 400; margin-bottom: 12px; }
    p { line-height: 1.7; color: #3d1a1e; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">One<em>Flesh</em></div>
      <div style="font-size:11px;color:rgba(226,201,126,0.6);margin-top:5px;letter-spacing:0.1em;text-transform:uppercase;">Reformed Church Matrimonial Platform</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">© OneFlesh · Built for Reformed churches across India · All alliances pastoral-approved</div>
  </div>
</body>
</html>
`;

export const EmailTemplates = {
  churchApproved: (pastorName: string, churchName: string) =>
    sendEmail({
      to: '',
      subject: 'Your Church Application Has Been Approved — OneFlesh',
      html: brandedTemplate(`
        <h2>Welcome to OneFlesh, ${pastorName}!</h2>
        <p>We are pleased to inform you that <strong>${churchName}</strong> has been approved on the OneFlesh platform.</p>
        <p>You can now create profiles for candidates in your congregation, search for matches, and manage alliances through the pastor dashboard.</p>
        <p style="color:#6b0f1a;font-style:italic;">"He who finds a wife finds a good thing and obtains favour from the LORD." — Proverbs 18:22</p>
      `),
    }),

  passwordReset: (resetUrl: string) =>
    brandedTemplate(`
      <h2>Reset Your Password</h2>
      <p>You requested a password reset for your OneFlesh account. Click the button below to set a new password:</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p style="font-size:12px;color:#7a5a5e;">This link expires in 15 minutes. If you did not request this, please ignore this email.</p>
    `),

  newInterest: (receivingPastor: string, candidateName: string, expressedByChurch: string) =>
    brandedTemplate(`
      <h2>New Interest Received</h2>
      <p>Dear ${receivingPastor},</p>
      <p><strong>${expressedByChurch}</strong> has expressed interest on behalf of their candidate regarding your profile for <strong>${candidateName}</strong>.</p>
      <p>Please log in to your dashboard to review the interest and respond within 14 days.</p>
    `),

  allianceAdvanced: (stage: number, stageLabel: string, parties: string) =>
    brandedTemplate(`
      <h2>Alliance Updated — Stage ${stage}: ${stageLabel}</h2>
      <p>The alliance for <strong>${parties}</strong> has advanced to Stage ${stage} — <em>${stageLabel}</em>.</p>
      <p>Please log in to your dashboard for further details and next steps.</p>
    `),

  counsellingReminder: (groomName: string, brideName: string, sessionNum: number, date: string) =>
    brandedTemplate(`
      <h2>Counselling Session Reminder</h2>
      <p>This is a reminder that <strong>Session ${sessionNum}</strong> for <strong>${groomName} & ${brideName}</strong> is scheduled on <strong>${date}</strong>.</p>
      <p>Please ensure both parties are prepared and the venue/video call details have been confirmed.</p>
    `),
};
