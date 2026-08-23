import { NextRequest, NextResponse } from 'next/server';
import { otpRequestSchema } from '@/lib/validation/schemas';
import { OtpRepository, UserRepository } from '@/lib/repositories/index';
import { RESET_TTL_MS } from '@/lib/repositories/local/LocalOtpRepository';
import { sendEmail } from '@/lib/email/emailService';
import { renderPasswordReset } from '@/lib/email/templates';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = otpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { identifier } = parsed.data;
  const isDev = process.env.NODE_ENV !== 'production';

  // Look up the existing profile WITHOUT creating one — responding
  // identically for known and unknown addresses prevents enumeration.
  const profile = await UserRepository.findByEmail(identifier);

  const response: Record<string, unknown> = {
    success: true,
    message: 'If an account exists with this email, a reset code has been sent.',
  };

  if (profile && EMAIL_RE.test(identifier)) {
    const code =
      isDev ? '123456' : String(Math.floor(100000 + Math.random() * 900000));

    const storeResult = OtpRepository.store(identifier, code, { ttlMs: RESET_TTL_MS });
    if (!storeResult.ok) {
      const retryAfter = storeResult.retryAfterSeconds ?? 3600;
      return NextResponse.json(
        { error: `Too many reset attempts. Please wait ${Math.ceil(retryAfter / 60)} minute(s).` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const result = await sendEmail({
      to: identifier,
      template: 'password_reset',
      userId: profile.id,
      ...renderPasswordReset({ name: profile.name, code }),
    });

    if (isDev) response.devCode = code;
    else if (!result.sent && result.reason) response.warnings = [result.reason];
  }

  return NextResponse.json(response, { status: 200 });
}
