// ============================================================
// OneFlesh — WhatsApp Service (Twilio WhatsApp Business API)
// ============================================================
//
// Uses the same Twilio credentials as the SMS utility.
// TWILIO_WHATSAPP_FROM must be set to the WhatsApp-enabled number
// in the format: whatsapp:+<number>
//
// Sandbox (development): whatsapp:+14155238886
// Production: whatsapp:+91<your-business-number>
//
// Recipients must have opted in via WhatsApp sandbox join message
// ("join <sandbox-keyword>") in development, or via business opt-in
// in production.
// ============================================================

import twilio from 'twilio';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let twilioClient: ReturnType<typeof twilio> | null = null;

function getClient(): ReturnType<typeof twilio> | null {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_FROM) {
    return null;
  }
  if (!twilioClient) {
    twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

// ─── Core send function ───────────────────────────────────────

/**
 * Send a WhatsApp message via Twilio.
 * @param to  Indian mobile number — bare 10 digits (e.g. "9876543210")
 *            or full E.164 without "whatsapp:" prefix (e.g. "+919876543210")
 * @param message  Message body (plain text; WhatsApp supports newlines and emoji)
 */
export async function sendWhatsApp(to: string, message: string): Promise<void> {
  const client = getClient();

  if (!client) {
    // Silently log in dev/test — never fail the main flow
    logger.warn(`[WHATSAPP MOCK] To: ${to} | ${message.slice(0, 80)}…`);
    return;
  }

  try {
    // Normalise to E.164 then add whatsapp: prefix
    const e164 = to.startsWith('+') ? to : to.startsWith('whatsapp:') ? to : `+91${to}`;
    const waTo = e164.startsWith('whatsapp:') ? e164 : `whatsapp:${e164}`;

    await client.messages.create({
      body: message,
      from: env.TWILIO_WHATSAPP_FROM,
      to: waTo,
    });

    logger.info(`WhatsApp sent to ${to.slice(0, 6)}***`);
  } catch (error) {
    // Non-fatal — WhatsApp failure must never break the main request flow
    logger.error(`WhatsApp send failed (to: ${to.slice(0, 6)}***):`, error);
  }
}

// ─── Message Templates ────────────────────────────────────────
// All messages are kept under 500 characters for mobile readability.
// Avoid including PII like full names, emails, or Aadhaar in message body.
// Use first names only where necessary (they are not sensitive in this context).

const SIGNATURE = '\n\n— OneFlesh\nhttps://oneflesh.in';

export const WhatsAppTemplates = {
  // ── Auth ────────────────────────────────────────────────────

  /** OTP for login / MFA verification */
  otp: (code: string): string =>
    `*OneFlesh* — Your OTP is:\n\n*${code}*\n\nValid for 5 minutes. Do not share this code with anyone.${SIGNATURE}`,

  /** Account locked after repeated failed login attempts */
  accountLocked: (): string =>
    `*OneFlesh* — ⚠️ Your account has been locked after multiple failed login attempts.\n\nCheck your email for instructions to unlock your account.${SIGNATURE}`,

  /** Password reset link */
  passwordReset: (resetUrl: string): string =>
    `*OneFlesh* — A password reset was requested for your account.\n\nReset link (valid 15 min):\n${resetUrl}\n\nIf you did not request this, please ignore.${SIGNATURE}`,

  // ── Church ──────────────────────────────────────────────────

  /** Church application approved by admin */
  churchApproved: (churchName: string): string =>
    `*OneFlesh* — 🎉 Congratulations!\n\nYour church *${churchName}* has been approved on the OneFlesh platform.\n\nYou may now create candidate profiles and manage alliances from your pastor dashboard.${SIGNATURE}`,

  /** Church application rejected */
  churchRejected: (churchName: string): string =>
    `*OneFlesh* — Your application for *${churchName}* could not be approved at this time.\n\nPlease check your email for the reason and contact support if you have questions.${SIGNATURE}`,

  // ── Profiles ─────────────────────────────────────────────────

  /** Profile approved by admin */
  profileApproved: (candidateName: string): string =>
    `*OneFlesh* — ✅ The profile for *${candidateName}* has been approved and is now visible to other churches on the platform.${SIGNATURE}`,

  /** Profile rejected by admin */
  profileRejected: (candidateName: string): string =>
    `*OneFlesh* — The profile for *${candidateName}* could not be approved at this time. Please log in to your dashboard for details.${SIGNATURE}`,

  // ── Alliances ────────────────────────────────────────────────

  /** New alliance interest received (notifies receiving pastor) */
  newInterest: (candidateName: string, expressedByChurch: string): string =>
    `*OneFlesh* — 📩 New Interest Received\n\n*${expressedByChurch}* has expressed interest regarding your candidate *${candidateName}*.\n\nPlease log in to review and respond within 14 days.${SIGNATURE}`,

  /** Alliance advanced to a new stage (notifies both pastors) */
  allianceAdvanced: (stage: number, stageLabel: string, partyNames: string): string =>
    `*OneFlesh* — 📋 Alliance Update\n\nThe alliance for *${partyNames}* has advanced to:\n\n*Stage ${stage} — ${stageLabel}*\n\nLog in to your dashboard for next steps.${SIGNATURE}`,

  /** Alliance dissolved (notifies both pastors) */
  allianceDissolved: (partyNames: string): string =>
    `*OneFlesh* — The alliance for *${partyNames}* has been dissolved.\n\nIf you have questions, please reach out to the other pastor or contact support.${SIGNATURE}`,

  // ── Counselling ──────────────────────────────────────────────

  /** New counselling registration — session 1 scheduled (notifies counsellor's pastor) */
  sessionScheduled: (groomName: string, brideName: string): string =>
    `*OneFlesh* — 📅 Pre-Marital Counselling Registered\n\nCounselling sessions have been scheduled for *${groomName} & ${brideName}*.\n\nSession 1 of 6 is ready. Log in to view the schedule.${SIGNATURE}`,

  /** Reminder before an upcoming session */
  counsellingReminder: (groomName: string, brideName: string, sessionNum: number, date: string): string =>
    `*OneFlesh* — 🔔 Counselling Reminder\n\nSession *${sessionNum} of 6* for *${groomName} & ${brideName}* is on *${date}*.\n\nPlease confirm the venue or video link with both parties.${SIGNATURE}`,

  /** Session marked as completed */
  sessionCompleted: (groomName: string, brideName: string, sessionNum: number, totalSessions: number): string =>
    `*OneFlesh* — ✅ Session ${sessionNum} of ${totalSessions} completed for *${groomName} & ${brideName}*.\n\n${sessionNum === totalSessions ? 'All sessions are now complete. The alliance may advance to Stage 5.' : `${totalSessions - sessionNum} session(s) remaining.`}${SIGNATURE}`,

  // ── Vendors ──────────────────────────────────────────────────

  /** Vendor contact request — notifies the vendor owner */
  vendorContact: (businessName: string, requestingChurch: string): string =>
    `*OneFlesh* — 📬 Vendor Contact Request\n\n*${requestingChurch}* has requested your contact details for *${businessName}*.\n\nTheir pastor has been sent your details via email.${SIGNATURE}`,

  /** Vendor approved */
  vendorApproved: (businessName: string): string =>
    `*OneFlesh* — ✅ Your vendor listing *${businessName}* has been approved and is now visible to all pastors on the platform.${SIGNATURE}`,

  // ── System ───────────────────────────────────────────────────

  /** Generic system notification */
  system: (title: string, body: string): string =>
    `*OneFlesh* — ${title}\n\n${body}${SIGNATURE}`,
};
