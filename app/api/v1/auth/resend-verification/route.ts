import { NextRequest, NextResponse } from 'next/server';
import { resendVerificationSchema } from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/optional';

/**
 * Re-sends Supabase's "Confirm your email" message for sign-ups that have
 * not been verified yet. Always responds generically so the endpoint cannot
 * be used to probe which addresses are registered.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Authentication service is not configured.' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = resendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const supabase = await createClient();
  try {
    await supabase.auth.resend({
      type: 'signup',
      email: parsed.data.email,
      options: { emailRedirectTo: `${origin}/login` },
    });
  } catch {
    // Ignore — generic response below keeps the flow non-enumerable.
  }

  return NextResponse.json(
    { success: true, message: 'If that address needs verification, a new email has been sent.' },
    { status: 200 }
  );
}
