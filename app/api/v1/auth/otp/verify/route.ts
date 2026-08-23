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

  const { identifier, code, purpose } = parsed.data;

  if (!OtpRepository.verify(identifier, code)) {
    return NextResponse.json(
      { error: 'Invalid or expired code. Please request a new one.' },
      { status: 401 }
    );
  }

  // ── Registration: complete the pending sign-up held server-side ───────────
  const registration = OtpRepository.getPendingRegistration(identifier);

  if (purpose === 'register' || registration) {
    if (!identifier.includes('@') || !registration) {
      return NextResponse.json(
        { error: 'Registration session expired. Please sign up again.' },
        { status: 410 }
      );
    }

    const admin = createAdminClient();

    const existing = await UserRepository.findByEmail(identifier);
    if (existing) {
      OtpRepository.clearPendingRegistration(identifier);
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 409 }
      );
    }

    const role = registration.userType === 'seller' ? 'seller' : 'buyer';

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: identifier,
      password: registration.password,
      email_confirm: true,
      user_metadata: {
        name: registration.name,
        ...(registration.phone ? { phone: registration.phone } : {}),
      },
      app_metadata: { role },
    });

    // The pending credentials have served their purpose either way.
    OtpRepository.clearPendingRegistration(identifier);

    if (createError || !created.user) {
      const msg = createError?.message?.toLowerCase().includes('already')
        ? 'An account with this email already exists. Please login instead.'
        : createError?.message || 'Failed to create account';
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: created.user.id,
        name: registration.name,
        email: identifier,
        role,
        ...(registration.phone ? { phone: registration.phone } : {}),
      },
      { onConflict: 'id' }
    );
    if (profileError) {
      console.error('[register] profile upsert failed:', profileError.message);
    }

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: registration.password,
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
          name: registration.name,
          email: identifier,
          phone: registration.phone ?? '',
          role,
          createdAt: created.user.created_at ?? new Date().toISOString(),
        };

    const response = NextResponse.json({ user, token: '' }, { status: 200 });
    // Start the sliding activity window (see proxy.ts) — new registrations
    // default to "remember me" for a 30-day persistent session.
    const cookieBase = {
      httpOnly: true as const,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
    response.cookies.set('em_active', '1', { ...cookieBase, maxAge: 30 * 60 });
    response.cookies.set('em_remember', '1', { ...cookieBase, maxAge: 30 * 24 * 60 * 60 });
    return response;
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
