import { NextRequest, NextResponse } from 'next/server';
import { ReviewRepository, ProductRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function GET(_request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reviews = await ReviewRepository.findByUser(user.id);

  const reviewsWithProducts = await Promise.all(reviews.map(async (review) => {
    const product = await ProductRepository.findById(review.productId);
    return {
      ...review,
      productName: product?.name ?? 'Unknown Product',
      productImage: product?.images?.[0] ?? '',
      productSlug: product?.slug ?? '',
    };
  }));

  return NextResponse.json({ reviews: reviewsWithProducts }, { status: 200 });
}
