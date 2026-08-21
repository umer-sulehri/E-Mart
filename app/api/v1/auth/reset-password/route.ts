import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/validation/schemas';
import { OtpRepository } from '@/lib/repositories/index';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { identifier, code, newPassword } = parsed.data;

  if (!OtpRepository.verify(identifier, code)) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', identifier)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
  }

  const { error } = await admin.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Password reset successful' }, { status: 200 });
}
