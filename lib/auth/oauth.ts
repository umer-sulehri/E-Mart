'use client';

import { createClient } from '@/lib/supabase/client';
import type { Provider } from '@supabase/supabase-js';

export async function signInWithOAuth(
  provider: Provider,
  redirectTo?: string
) {
  const supabase = createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  const callbackUrl = redirectTo
    ? `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
    : `${siteUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl,
      queryParams:
        provider === 'google'
          ? { access_type: 'offline', prompt: 'consent' }
          : undefined,
    },
  });

  if (error) throw error;
  if (data?.url) {
    window.location.href = data.url;
  }
}
