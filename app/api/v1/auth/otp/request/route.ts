import { NextRequest, NextResponse } from 'next/server';
import { otpRequestSchema } from '@/lib/validation/schemas';
import { OtpRepository } from '@/lib/repositories/index';
import { generateOtp, sendSms } from '@/lib/sms/smsService';
import { sendEmail } from '@/lib/email/emailService';
import { renderOtpEmail } from '@/lib/email/templates';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = otpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { identifier } = parsed.data;
  const code = generateOtp();
  const isDev = process.env.NODE_ENV !== 'production';
  const deliveryNotes: string[] = [];

  OtpRepository.store(identifier, code);

  if (EMAIL_RE.test(identifier)) {
    const result = await sendEmail({
      to: identifier,
      template: 'email_verification',
      ...renderOtpEmail({ code }),
    });
    if (!result.sent && result.reason) deliveryNotes.push(result.reason);
  } else {
    const result = await sendSms({
      to: identifier,
      template: 'otp',
      message: `E-Mart: Your verification code is ${code}. It expires in 10 minutes. Do not share it with anyone.`,
    });
    if (!result.sent && result.reason) deliveryNotes.push(result.reason);
  }

  // In development, surface the code so the flow remains testable without
  // provider credentials. Never expose it in production.
  const includeDevCode = isDev;

  return NextResponse.json(
    {
      success: true,
      message: 'OTP sent',
      ...(includeDevCode ? { devCode: code } : {}),
      ...(deliveryNotes.length > 0 && !includeDevCode ? { warnings: deliveryNotes } : {}),
    },
    { status: 200 }
  );
}
