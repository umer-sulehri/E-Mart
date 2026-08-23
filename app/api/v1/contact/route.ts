import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/emailService';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('A valid email is required').max(200),
  subject: z.string().trim().min(3, 'Subject is required').max(150),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
  // Honeypot: bots fill every input; humans never see this one.
  company: z.string().max(0).optional(),
});

/** Per-IP throttle: max 5 messages per 15 minutes. */
interface SendEntry {
  count: number;
  firstAt: number;
}
const sendMap = new Map<string, SendEntry>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS = 5;

function isThrottled(ip: string): boolean {
  const now = Date.now();
  const entry = sendMap.get(ip);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    sendMap.set(ip, { count: 1, firstAt: now });
    return false;
  }
  entry.count += 1;
  if (entry.count > MAX_SENDS) return true;
  return false;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Honeypot filled -> pretend success without doing anything.
  if (parsed.data.company) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const ip = request.headers.get('x-forwarded-for') || 'local';
  if (isThrottled(ip)) {
    return NextResponse.json(
      { error: 'Too many messages sent. Please try again later.' },
      { status: 429 }
    );
  }

  const { name, email, subject, message } = parsed.data;
  const recipient = process.env.CONTACT_EMAIL ?? process.env.EMAIL_FROM;

  if (recipient) {
    const html = `
      <h2>New Contact Form Message</h2>
      <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <hr />
      <div>${escapeHtml(message).replace(/\n/g, '<br />')}</div>
    `;
    const result = await sendEmail({
      to: recipient,
      replyTo: email,
      subject: `[E-Mart Contact] ${subject}`,
      html,
      template: 'contact',
    });

    if (!result.sent && result.reason !== 'Email service is not configured (set RESEND_API_KEY and EMAIL_FROM)') {
      return NextResponse.json(
        { error: 'Failed to send your message. Please try again later.' },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
