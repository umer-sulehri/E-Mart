import { NextResponse } from 'next/server';
import { ReviewRepository, ProductRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sellerProducts = await ProductRepository.findAll({ sellerId: user.id });
  const productIds = sellerProducts.products.map((p) => p.id);
  const reviews = await ReviewRepository.findBySellerProducts(productIds);

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
