import { NextRequest, NextResponse } from 'next/server';
import { WishlistRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await WishlistRepository.getItems(user.id);
  return NextResponse.json({ items }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (!body.productId || typeof body.productId !== 'string') {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  await WishlistRepository.add(user.id, body.productId);
  return NextResponse.json({ success: true }, { status: 200 });
}
