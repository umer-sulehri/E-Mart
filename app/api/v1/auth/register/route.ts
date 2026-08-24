import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/optional';
import { UserRepository } from '@/lib/repositories/index';

/**
 * Registration uses Supabase Auth's native email verification: signUp
 * triggers a "Confirm your email" message; the profile row is created on
 * first login (or immediately when confirmation is disabled and a session
 * comes back straight away).
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Authentication service is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password, userType, phone } = parsed.data;
  const role = userType === 'seller' ? 'seller' : 'buyer';
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone: phone ?? '', role },
      emailRedirectTo: `${origin}/login`,
    },
  });

  if (error) {
    if (
      error.code === 'user_already_exists' ||
      /already registered|already exists/i.test(error.message)
    ) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Try logging in instead.' },
        { status: 409 }
      );
    }
    if (/rate|too many/i.test(error.message)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a moment and try again.' },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Email confirmation disabled in Supabase -> session returns instantly.
  if (data.session && data.user) {
    try {
      await UserRepository.create({
        name,
        email,
        phone: phone ?? '',
        role,
      });
    } catch {
      // Profile may already exist or DB may be unavailable — login backfills it.
    }
    return NextResponse.json({ verified: true }, { status: 201 });
  }

  return NextResponse.json({ verificationRequired: true }, { status: 201 });
}
