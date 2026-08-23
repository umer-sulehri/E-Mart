import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured } from '@/lib/supabase/optional';
import { createAdminClient } from '@/lib/supabase/admin';

const subscribeSchema = z.object({
  email: z.string().email('A valid email address is required'),
  name: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = subscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
  }

  const { email, name } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Local/mock mode: acknowledge without persisting.
    return NextResponse.json(
      { subscribed: true, persisted: false },
      { status: 200 }
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('newsletter_subscribers')
      .upsert(
        { email: normalizedEmail, name: name ?? null },
        { onConflict: 'email', ignoreDuplicates: false }
      );
    if (error) {
      return NextResponse.json(
        { error: 'Could not subscribe right now. Please try again later.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ subscribed: true, persisted: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Could not subscribe right now. Please try again later.' },
      { status: 503 }
    );
  }
}
