import { NextRequest, NextResponse } from 'next/server';
import { ReviewRepository, ProductRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'seller' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const review = await ReviewRepository.findById(id);
  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const product = await ProductRepository.findById(review.productId);
  if (!product || product.sellerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const reply = typeof body.reply === 'string' ? body.reply.trim() : '';
  if (!reply || reply.length > 1000) {
    return NextResponse.json({ error: 'reply is required (max 1000 characters)' }, { status: 400 });
  }

  const updated = await ReviewRepository.addSellerReply(id, reply);
  if (!updated) {
    return NextResponse.json({ error: 'Failed to save reply' }, { status: 500 });
  }
  return NextResponse.json({ review: updated }, { status: 200 });
}
