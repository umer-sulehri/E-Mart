import { cookies } from 'next/headers';
import { UserRepository } from '@/lib/repositories/index';
import { User } from '@/lib/types';

export async function getSession(): Promise<User | null> {
  const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (useSupabase) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;
    const user = await UserRepository.findById(authUser.id);
    return user;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const user = await UserRepository.findById(decoded.userId);
    if (!user) return null;
    return user;
  } catch {
    const user = await UserRepository.findByToken(token);
    return user;
  }
}
