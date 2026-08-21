import { createClient } from './server';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return (
    url.length > 0 &&
    key.length > 0 &&
    !url.includes('your-') &&
    !key.includes('your-') &&
    url.startsWith('http')
  );
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Returns a Supabase server client when the project is configured,
 * otherwise null. Never throws — callers must handle null (local/dev mode).
 */
export async function getOptionalSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    return await createClient();
  } catch {
    return null;
  }
}
