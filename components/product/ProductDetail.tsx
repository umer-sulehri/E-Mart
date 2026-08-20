'use client';

import { useState } from 'react';
import { Product, Review } from '@/lib/types';
import { useCartStore } from '@/lib/store/cartStore';
import { ProductGallery } from '@/components/product/ProductGallery';
import { Button } from '@/components/ui/Button';
import { PlusIcon, MinusIcon, StarIcon } from '@/components/icons';
import { mockReviews } from '@/lib/mock/orders';

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const reviews = mockReviews.filter((r) => r.productId === product.id);
  const onSale = product.originalPrice && product.originalPrice > product.price;
  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setQuantity(1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <ProductGallery images={product.images} alt={product.name} />

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
            {product.name}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5" aria-label={`Rating: ${product.rating} out of 5`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon key={star} className="w-5 h-5 text-warning" filled={star <= Math.round(product.rating)} />
              ))}
            </div>
            <span className="text-sm text-text-secondary">({product.reviewCount} reviews)</span>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-primary-dark">PKR {product.price.toLocaleString()}</span>
            {onSale && (
              <>
                <span className="text-lg text-text-secondary line-through">PKR {product.originalPrice!.toLocaleString()}</span>
                <span className="text-sm font-semibold text-accent bg-accent/10 px-2 py-1 rounded-[8px]">
                  -{Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}%
                </span>
              </>
            )}
          </div>
        </div>

        <p className="text-text-secondary leading-relaxed">{product.description}</p>

        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${outOfStock ? 'text-error' : 'text-success'}`}>
            {outOfStock ? 'Out of Stock' : `${product.stock} in stock`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-text-primary">Quantity:</span>
          <div className="flex items-center border border-border rounded-[12px] overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="w-[48px] h-[48px] flex items-center justify-center text-text-primary hover:bg-surface transition-colors disabled:opacity-50"
            >
              <MinusIcon className="w-5 h-5" />
            </button>
            <span className="w-[48px] h-[48px] flex items-center justify-center text-base font-semibold text-text-primary border-x border-border">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              disabled={quantity >= product.stock}
              aria-label="Increase quantity"
              className="w-[48px] h-[48px] flex items-center justify-center text-text-primary hover:bg-surface transition-colors disabled:opacity-50"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <Button size="lg" disabled={outOfStock} onClick={handleAddToCart} className="w-full">
          Add to Cart
        </Button>

        {reviews.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-text-primary mb-4">Reviews</h2>
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-bg border border-border rounded-[16px] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-text-primary">{review.userName}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} className="w-3 h-3 text-warning" filled={star <= review.rating} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
