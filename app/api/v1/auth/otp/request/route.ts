import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { otpRequestSchema, registrationOtpSchema } from '@/lib/validation/schemas';
import { OtpRepository } from '@/lib/repositories/index';
import { generateOtp, sendSms } from '@/lib/sms/smsService';
import { sendEmail } from '@/lib/email/emailService';
import { renderOtpEmail } from '@/lib/email/templates';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Registration requests carry the full sign-up payload; it is stored
  // server-side alongside the OTP so credentials never sit in browser storage.
  const isRegistration = !!(body as Record<string, unknown>).name;
  const schema = isRegistration ? registrationOtpSchema : otpRequestSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { identifier } = parsed.data;
  const code = generateOtp();
  const isDev = process.env.NODE_ENV !== 'production';
  const deliveryNotes: string[] = [];

  const pendingRegistration = isRegistration
    ? (() => {
        const data = parsed.data as z.infer<typeof registrationOtpSchema>;
        return {
          name: data.name,
          phone: data.phone,
          userType: data.userType,
          password: data.password,
        };
      })()
    : undefined;

  const storeResult = OtpRepository.store(identifier, code, {
    pendingRegistration,
  });

  if (!storeResult.ok) {
    const retryAfter = storeResult.retryAfterSeconds ?? 3600;
    return NextResponse.json(
      {
        error: `Too many codes requested. Please wait ${Math.ceil(retryAfter / 60)} minute(s) before requesting another.`,
      },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

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
      message: `E-Mart: Your verification code is ${code}. It expires in 15 minutes. Do not share it with anyone.`,
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
