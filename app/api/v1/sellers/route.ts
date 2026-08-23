import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/optional';

export interface SellerOption {
  id: string;
  name: string;
  storeName?: string;
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sellers: [] }, { status: 200 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, store_name')
    .eq('role', 'seller')
    .order('name', { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Failed to load sellers' }, { status: 500 });
  }

  const sellers: SellerOption[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name ?? 'Seller',
    storeName: row.store_name ?? undefined,
  }));

  return NextResponse.json({ sellers }, {
    status: 200,
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
