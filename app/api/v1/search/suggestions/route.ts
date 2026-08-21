import { NextRequest, NextResponse } from 'next/server';
import { getSuggestions } from '@/lib/search/searchService';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const suggestions = await getSuggestions(q);
  return NextResponse.json({ suggestions }, { status: 200 });
}
