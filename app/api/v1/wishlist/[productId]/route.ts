import { NextRequest, NextResponse } from 'next/server';
import { WishlistRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;
  await WishlistRepository.remove(user.id, productId);
  return NextResponse.json({ success: true }, { status: 200 });
}
