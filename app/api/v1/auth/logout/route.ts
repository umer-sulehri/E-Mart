import { NextResponse } from 'next/server';
import { getOptionalSupabase } from '@/lib/supabase/optional';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });

  // Terminate the Supabase auth session (clears sb-* cookies) when configured.
  const supabase = await getOptionalSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Session may already be gone; cookie cleanup below still applies.
    }
  }

  response.cookies.set('session', '', { maxAge: 0, path: '/' });
  return response;
}
