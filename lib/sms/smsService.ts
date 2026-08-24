import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/optional';

export type SmsTemplate =
  | 'order_confirmation'
  | 'order_shipped'
  | 'delivery_alert'
  | 'promotional';

export interface SendSmsParams {
  to: string;
  message: string;
  template: SmsTemplate;
  userId?: string;
}

export interface SendSmsResult {
  sent: boolean;
  messageId?: string;
  reason?: string;
}

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

export function isSmsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
}

/** Normalises Pakistani numbers to E.164 (+92...). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s-()]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('92')) return `+${digits}`;
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`;
  return `+92${digits}`;
}

export function isValidPkPhone(phone: string): boolean {
  return /^\+92[0-9]{10}$/.test(normalizePhone(phone));
}

async function logSms(params: SendSmsParams, status: 'sent' | 'failed', error?: string, messageId?: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createAdminClient();
    await supabase.from('sms_logs').insert({
      user_id: params.userId ?? null,
      phone: params.to,
      template: params.template,
      status,
      provider: 'twilio',
      provider_message_id: messageId ?? null,
      error: error ?? null,
    });
  } catch {
    // Logging must never break the send flow.
  }
}

/**
 * Sends an SMS via the Twilio REST API using Basic auth.
 * Falls back to a logged failure when credentials are absent (dev mode).
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const to = normalizePhone(params.to);
  if (!isValidPkPhone(to) && !/^\+[1-9][0-9]{6,14}$/.test(to)) {
    return { sent: false, reason: 'Invalid phone number format' };
  }

  if (!isSmsConfigured()) {
    await logSms({ ...params, to }, 'failed', 'SMS_NOT_CONFIGURED');
    return { sent: false, reason: 'SMS service is not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)' };
  }

  try {
    const sid = process.env.TWILIO_ACCOUNT_SID as string;
    const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');

    const res = await fetch(`${TWILIO_API_BASE}/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: process.env.TWILIO_FROM_NUMBER as string,
        Body: params.message,
      }),
    });

    const data = (await res.json()) as { sid?: string; message?: string };

    if (!res.ok) {
      const reason = data.message ?? `Twilio request failed (${res.status})`;
      await logSms({ ...params, to }, 'failed', reason);
      return { sent: false, reason };
    }

    await logSms({ ...params, to }, 'sent', undefined, data.sid);
    return { sent: true, messageId: data.sid };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown SMS error';
    await logSms({ ...params, to }, 'failed', reason);
    return { sent: false, reason };
  }
}

