/**
 * SMS service — abstracted so we can swap providers or use stubs in dev.
 *
 * In production, uses Twilio. In development, logs to console.
 */

import { config } from '../config';

interface SmsResult {
  success: boolean;
  messageId?: string;
}

/**
 * Send an SMS message. Automatically uses Twilio in production
 * or logs to console in development.
 */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (config.smsProvider === 'stub') {
    console.log(`[SMS STUB] To: ${to} | Body: ${body}`);
    return { success: true, messageId: 'stub' };
  }

  // Twilio
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioFromNumber) {
    console.error('Twilio credentials not configured');
    return { success: false };
  }

  const twilio = require('twilio');
  const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

  try {
    const message = await client.messages.create({
      body,
      from: config.twilioFromNumber,
      to,
    });

    return { success: true, messageId: message.sid };
  } catch (err) {
    console.error('Twilio SMS failed:', err);
    return { success: false };
  }
}

/**
 * Send a verification code via SMS.
 */
export async function sendVerificationCode(phone: string, code: string): Promise<SmsResult> {
  return sendSms(phone, `Your PROOF verification code is: ${code}`);
}
