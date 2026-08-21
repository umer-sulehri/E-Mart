import { NextRequest, NextResponse } from 'next/server';
import { loginCredentialsSchema } from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/server';
import { UserRepository } from '@/lib/repositories/index';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = loginCredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  let user = await UserRepository.findById(data.user.id);
  if (!user) {
    const meta = (data.user.user_metadata ?? {}) as Record<string, string>;
    try {
      user = await UserRepository.create({
        name: meta.name || meta.full_name || email.split('@')[0],
        email,
        phone: meta.phone ?? '',
        role: 'buyer',
      });
    } catch {
      const fallback: User = {
        id: data.user.id,
        name: meta.name || email.split('@')[0],
        email,
        phone: meta.phone ?? '',
        role: 'buyer',
        createdAt: data.user.created_at ?? new Date().toISOString(),
      };
      return NextResponse.json({ user: fallback }, { status: 200 });
    }
  }

  return NextResponse.json({ user }, { status: 200 });
}
