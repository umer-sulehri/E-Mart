import { apiFetch } from '@/lib/api/client';

/**
 * Terminates the server session (Supabase + legacy cookie) and clears any
 * client-side auth state that depends on it. Never throws — a network
 * failure must not trap the user inside a dashboard.
 */
export async function signOut(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Session cleanup is best-effort; the caller clears local state regardless.
  }
}
