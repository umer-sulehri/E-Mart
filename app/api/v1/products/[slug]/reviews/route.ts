import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository, ReviewRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await ProductRepository.findBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  const reviews = await ReviewRepository.findByProduct(product.id);
  return NextResponse.json({ reviews }, { status: 200 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const product = await ProductRepository.findBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const body = await request.json();

  if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
  }
  if (!body.comment || typeof body.comment !== 'string') {
    return NextResponse.json({ error: 'comment is required' }, { status: 400 });
  }

  const review = await ReviewRepository.create({
    userId: user.id,
    userName: user.name,
    productId: product.id,
    rating: body.rating,
    comment: body.comment,
  });

  return NextResponse.json({ review }, { status: 201 });
}
