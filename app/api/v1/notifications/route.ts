import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { getOptionalSupabase } from '@/lib/supabase/optional';

export interface FeedNotification {
  id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getOptionalSupabase();
  if (!supabase) {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 200 });
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 30), 100);

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, message, link, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }

  const notifications: FeedNotification[] = (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message ?? undefined,
    link: row.link ?? undefined,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({ notifications, unreadCount }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getOptionalSupabase();
  if (!supabase) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const body = await request.json().catch(() => ({}));
  const { id, all } = body as { id?: string; all?: boolean };

  let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
  if (all || !id) {
    query = query.eq('is_read', false);
  } else {
    query = query.eq('id', id);
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
