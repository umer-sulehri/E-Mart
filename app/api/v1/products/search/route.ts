import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';
import { recordSearch } from '@/lib/search/searchService';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (!q) {
    return NextResponse.json({ items: [], total: 0 }, { status: 200 });
  }
  const items = await ProductRepository.search(q);

  const user = await getSession();
  void recordSearch(q, user?.id);

  return NextResponse.json({ items, total: items.length }, { status: 200 });
}
