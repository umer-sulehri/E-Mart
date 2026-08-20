import { NextRequest, NextResponse } from 'next/server';
import { otpVerifySchema } from '@/lib/validation/schemas';
import { OtpRepository, UserRepository } from '@/lib/repositories/index';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { identifier, code } = parsed.data;

  if (!OtpRepository.verify(identifier, code)) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
  }

  const user = await UserRepository.findOrCreate(identifier);
  const token = await UserRepository.createSession(user.id, user.role);

  const response = NextResponse.json({ user, token }, { status: 200 });
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
