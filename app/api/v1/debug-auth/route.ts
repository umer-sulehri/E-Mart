import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll().map((c) => ({ name: c.name, len: c.value.length }));

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  let profileQuery: unknown = null;
  let sessionResult: unknown = null;
  if (data?.user) {
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    profileQuery = { profile: prof, error: profErr?.message ?? null };

    const { getSession } = await import('@/lib/auth/getSession');
    const s = await getSession();
    sessionResult = s ? { id: s.id, email: s.email } : null;
  }

  return NextResponse.json(
    {
      cookies: all,
      hasUser: !!data?.user,
      userId: data?.user?.id ?? null,
      authError: error?.message ?? null,
      profileQuery,
      sessionResult,
    },
    { status: 200 }
  );
}
