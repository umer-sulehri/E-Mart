import { NextRequest, NextResponse } from 'next/server';
import { otpVerifySchema } from '@/lib/validation/schemas';
import { OtpRepository, UserRepository } from '@/lib/repositories/index';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = otpVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { identifier, code, purpose, name, userType, password, phone } = parsed.data;

  if (!OtpRepository.verify(identifier, code)) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
  }

  // ── Registration: create a real Supabase auth account and sign in ──────────
  if (purpose === 'register') {
    if (!identifier.includes('@') || !password) {
      return NextResponse.json(
        { error: 'Email and password are required to complete registration' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const existing = await UserRepository.findByEmail(identifier);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 409 }
      );
    }

    const metadata: Record<string, string> = {};
    if (name) metadata.name = name;
    if (phone) metadata.phone = phone;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: identifier,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (createError || !created.user) {
      const msg = createError?.message?.toLowerCase().includes('already')
        ? 'An account with this email already exists. Please login instead.'
        : createError?.message || 'Failed to create account';
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    const role = userType === 'seller' ? 'seller' : 'buyer';
    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: created.user.id,
        name: name ?? identifier.split('@')[0],
        email: identifier,
        role,
      },
      { onConflict: 'id' }
    );
    if (profileError) {
      console.error('[register] profile upsert failed:', profileError.message);
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });
    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 500 });
    }

    const { data: profileRow } = await admin
      .from('profiles')
      .select('*')
      .eq('id', created.user.id)
      .single();

    const user = profileRow
      ? {
          id: profileRow.id,
          name: profileRow.name,
          email: profileRow.email ?? identifier,
          phone: profileRow.phone ?? '',
          role: profileRow.role,
          avatar: profileRow.avatar_url ?? undefined,
          createdAt: profileRow.created_at,
        }
      : {
          id: created.user.id,
          name: name ?? identifier.split('@')[0],
          email: identifier,
          phone: phone ?? '',
          role,
          createdAt: created.user.created_at ?? new Date().toISOString(),
        };

    return NextResponse.json({ user, token: '' }, { status: 200 });
  }

  // ── Legacy/other purposes (e.g. identifier-based flows) ────────────────────
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
