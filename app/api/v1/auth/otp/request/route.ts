import { NextRequest, NextResponse } from 'next/server';
import { otpRequestSchema } from '@/lib/validation/schemas';
import { OtpRepository, UserRepository } from '@/lib/repositories/index';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = otpRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { identifier } = parsed.data;

  await UserRepository.findOrCreate(identifier);

  const code =
    process.env.NODE_ENV === 'production'
      ? String(Math.floor(100000 + Math.random() * 900000))
      : '123456';

  OtpRepository.store(identifier, code);

  return NextResponse.json({ success: true, message: 'OTP sent' }, { status: 200 });
}
