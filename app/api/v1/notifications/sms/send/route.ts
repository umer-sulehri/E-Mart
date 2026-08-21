import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/getSession';
import { sendSms } from '@/lib/sms/smsService';

const schema = z.object({
  to: z.string().min(8).max(16),
  message: z.string().min(1).max(480),
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

  const result = await sendSms({
    to: parsed.data.to,
    message: parsed.data.message,
    template: 'promotional',
    userId: user.id,
  });

  return NextResponse.json(result, { status: result.sent ? 200 : 503 });
}
