import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { getTrendingSearches, getSearchHistory } from '@/lib/search/searchService';

export async function GET() {
  const [trending, user] = await Promise.all([getTrendingSearches(), getSession()]);
  const recent = user ? await getSearchHistory(user.id) : [];
  return NextResponse.json({ trending, recent }, { status: 200 });
}
