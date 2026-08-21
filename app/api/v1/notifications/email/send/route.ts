import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/getSession';
import { sendEmail, EmailTemplate } from '@/lib/email/emailService';

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  template: z.enum([
    'order_confirmation',
    'order_shipped',
    'order_delivered',
    'payment_confirmation',
    'password_reset',
    'refund_processed',
    'review_reminder',
    'promotional',
    'email_verification',
  ]),
});

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const result = await sendEmail({
    to: body.to,
    subject: body.subject,
    html: body.html,
    template: body.template as EmailTemplate,
    userId: user.id,
  });

  return NextResponse.json(result, { status: result.sent ? 200 : 503 });
}
