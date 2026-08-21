import { getOptionalSupabase } from '@/lib/supabase/optional';

export type EmailTemplate =
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'payment_confirmation'
  | 'password_reset'
  | 'refund_processed'
  | 'review_reminder'
  | 'promotional'
  | 'email_verification';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  template: EmailTemplate;
  userId?: string;
}

export interface SendEmailResult {
  sent: boolean;
  messageId?: string;
  reason?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

async function logEmail(params: SendEmailParams, status: 'sent' | 'failed', error?: string, messageId?: string): Promise<void> {
  const supabase = await getOptionalSupabase();
  if (!supabase) return;
  try {
    await supabase.from('email_logs').insert({
      user_id: params.userId ?? null,
      to_address: params.to,
      template: params.template,
      subject: params.subject,
      status,
      provider: 'resend',
      provider_message_id: messageId ?? null,
      error: error ?? null,
    });
  } catch {
    // Logging must never break the send flow.
  }
}

/**
 * Sends a transactional email through the Resend REST API.
 * When RESEND_API_KEY is not configured (local/dev), the email is only
 * logged as failed with a clear reason so flows keep working offline.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!params.to || !params.to.includes('@')) {
    return { sent: false, reason: 'Invalid recipient address' };
  }

  if (!isEmailConfigured()) {
    await logEmail(params, 'failed', 'EMAIL_NOT_CONFIGURED');
    return { sent: false, reason: 'Email service is not configured (set RESEND_API_KEY and EMAIL_FROM)' };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = (await res.json()) as { id?: string; message?: string };

    if (!res.ok) {
      const error = data.message ?? `Resend request failed (${res.status})`;
      await logEmail(params, 'failed', error);
      return { sent: false, reason: error };
    }

    await logEmail(params, 'sent', undefined, data.id);
    return { sent: true, messageId: data.id };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown email error';
    await logEmail(params, 'failed', reason);
    return { sent: false, reason };
  }
}
