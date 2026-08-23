import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository, ReviewRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';
import { getPurchaserIds } from '@/lib/reviews/purchaseVerification';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await ProductRepository.findBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const [reviews, purchaserIds, user] = await Promise.all([
    ReviewRepository.findByProduct(product.id),
    getPurchaserIds(product.id),
    getSession().catch(() => null),
  ]);

  return NextResponse.json(
    {
      reviews: reviews.map((review) => ({ ...review, verified: purchaserIds.has(review.userId) })),
      canReview: !!user && purchaserIds.has(user.id),
    },
    { status: 200 },
  );
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

  const purchaserIds = await getPurchaserIds(product.id);
  if (!purchaserIds.has(user.id)) {
    return NextResponse.json(
      { error: 'Only customers who have purchased this product can review it.' },
      { status: 403 },
    );
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

  return NextResponse.json({ review: { ...review, verified: true } }, { status: 201 });
}
