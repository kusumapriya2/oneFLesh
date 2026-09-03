// ============================================================
// OneFlesh — SMS Service (Twilio)
// ============================================================

import twilio from 'twilio';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let twilioClient: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  if (!twilioClient) {
    twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export async function sendSMS(to: string, message: string): Promise<void> {
  const client = getClient();

  if (!client) {
    logger.warn(`[SMS MOCK] To: ${to} | Message: ${message}`);
    return;
  }

  try {
    const formattedTo = to.startsWith('+') ? to : `+91${to}`;
    await client.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to: formattedTo,
    });
    logger.info(`SMS sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send SMS:', error);
    // Don't throw — SMS failure shouldn't break the flow
  }
}

export const SMSTemplates = {
  otp: (code: string) => `OneFlesh: Your OTP is ${code}. Valid for 5 minutes. Do not share.`,
  newInterest: (candidateName: string) =>
    `OneFlesh: New alliance interest received for ${candidateName}. Log in to respond.`,
  counsellingReminder: (sessionNum: number, date: string) =>
    `OneFlesh: Reminder — Pre-marital counselling Session ${sessionNum} on ${date}.`,
  accountLocked: () =>
    `OneFlesh: Your account has been locked after multiple failed login attempts. Check your email to unlock.`,
};
