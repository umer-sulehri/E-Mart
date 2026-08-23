import { NextRequest, NextResponse } from 'next/server';
import { changePasswordSchema } from '@/lib/validation/schemas';
import { getSession } from '@/lib/auth/getSession';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  if (!useSupabase) {
    // Legacy local mode has no password store to update.
    return NextResponse.json(
      { error: 'Password changes are only available in the deployed environment.' },
      { status: 501 }
    );
  }

  const supabase = await createClient();

  // Verify the current password by re-authenticating. This also guards
  // against session-fixation style changes without knowledge of the old
  // credential.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email ?? '',
    password: currentPassword,
  });
  if (verifyError) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Best-effort: revoke refresh tokens for every *other* session so a stolen
  // login elsewhere is invalidated by a password change. The current session
  // stays signed in.
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const admin = createAdminClient();
      await admin.auth.admin.signOut(session.access_token, 'others');
    }
  } catch {
    // Non-fatal — the password itself was already changed successfully.
  }

  return NextResponse.json({ success: true, message: 'Password changed successfully' }, { status: 200 });
}
