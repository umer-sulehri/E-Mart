import { NextRequest, NextResponse } from 'next/server';
import { ReviewRepository } from '@/lib/repositories/index';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;

  try {
    const reviews = await ReviewRepository.findRecent(limit);
    return NextResponse.json({ reviews }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}
