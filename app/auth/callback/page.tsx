'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get('redirect') || '/';
  const [error, setError] = useState<string | null>(null);

  function roleFromPath(path: string): 'customer' | 'seller' | 'admin' {
    if (path.startsWith('/seller')) return 'seller';
    if (path.startsWith('/admin')) return 'admin';
    return 'customer';
  }

  useEffect(() => {
    const supabase = createClient();

    async function handleAuth() {
      try {
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (!profile) {
            const firstName =
              user.user_metadata?.first_name ||
              user.user_metadata?.full_name?.split(' ')[0] ||
              '';
            const lastName =
              user.user_metadata?.last_name ||
              user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
              '';

            await supabase.from('profiles').insert({
              id: user.id,
              email: user.email!,
              first_name: firstName,
              last_name: lastName,
              role: roleFromPath(requestedRedirect),
              is_email_verified: true,
              profile_image_url: user.user_metadata?.avatar_url || null,
            });

            router.push(
              roleFromPath(requestedRedirect) === 'seller'
                ? '/seller'
                : roleFromPath(requestedRedirect) === 'admin'
                ? '/admin'
                : '/dashboard'
            );
          } else {
            router.push(requestedRedirect === '/' ? '/dashboard' : requestedRedirect);
          }
        } else {
          setError('Authentication failed — no user found');
        }
      } catch {
        setError('Something went wrong during authentication');
      }
    }

    handleAuth();
  }, [router, requestedRedirect]);

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-sm text-danger">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="text-sm font-medium text-primary hover:text-primary-500"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-500">Signing you in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
