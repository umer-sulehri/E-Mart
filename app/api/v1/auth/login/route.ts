import { NextRequest, NextResponse } from 'next/server';
import { loginCredentialsSchema } from '@/lib/validation/schemas';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UserRepository } from '@/lib/repositories/index';
import { User } from '@/lib/types';

/** Failed-login tracking: 5 attempts -> 15 minute lockout per email+IP. */
interface AttemptEntry {
  count: number;
  firstAt: number;
  lockedUntil?: number;
}

const attemptMap = new Map<string, AttemptEntry>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const ACTIVE_COOKIE = 'em_active';
const REMEMBER_COOKIE = 'em_remember';
const ACTIVE_TTL_S = 30 * 60; // sliding 30-minute inactivity window
const REMEMBER_TTL_S = 30 * 24 * 60 * 60; // 30 days

function registerFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attemptMap.get(key);
  if (!entry || now - entry.firstAt > ATTEMPT_WINDOW_MS) {
    attemptMap.set(key, { count: 1, firstAt: now });
    return;
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
}

function isLockedOut(key: string): boolean {
  const entry = attemptMap.get(key);
  if (!entry?.lockedUntil) return false;
  if (Date.now() < entry.lockedUntil) return true;
  attemptMap.delete(key);
  return false;
}

function clearAttempts(key: string): void {
  attemptMap.delete(key);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginCredentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const rememberMe = (body as { rememberMe?: boolean } | null)?.rememberMe ?? true;

  const ip = request.headers.get('x-forwarded-for') || 'local';
  const attemptKey = `${email.toLowerCase()}:${ip}`;
  if (isLockedOut(attemptKey)) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Please try again in 15 minutes.' },
      { status: 423 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    registerFailedAttempt(attemptKey);
    const remaining = Math.max(0, MAX_ATTEMPTS - (attemptMap.get(attemptKey)?.count ?? 0));
    return NextResponse.json(
      {
        error:
          remaining <= 2 && remaining > 0
            ? `Invalid email or password. ${remaining} attempt(s) left before temporary lockout.`
            : 'Invalid email or password',
      },
      { status: 401 }
    );
  }

  clearAttempts(attemptKey);

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

  // Backfill app_metadata.role so edge middleware can enforce role-based
  // routing for accounts created before role metadata was introduced.
  try {
    if ((data.user.app_metadata as Record<string, string> | undefined)?.role !== user.role) {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...((data.user.app_metadata ?? {}) as Record<string, unknown>), role: user.role },
      });
    }
  } catch {
    // Non-fatal — API-level requireAdmin() still protects admin routes.
  }

  const response = NextResponse.json({ user }, { status: 200 });
  response.cookies.set(ACTIVE_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ACTIVE_TTL_S,
  });
  if (rememberMe) {
    response.cookies.set(REMEMBER_COOKIE, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REMEMBER_TTL_S,
    });
  }

  return response;
}
