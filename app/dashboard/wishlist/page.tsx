'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ShoppingCart, Heart } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatPrice, calculateDiscount } from '@/lib/utils';

interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  rating: number;
  inStock: boolean;
}

const mockWishlist: WishlistProduct[] = [
  { id: '1', name: 'Organic Bananas 1kg', price: 450, image: '/images/products/banana.jpg', rating: 4.5, inStock: true },
  { id: '2', name: 'Almond Milk 1L', price: 520, discountPrice: 480, image: '/images/products/almond-milk.jpg', rating: 4.2, inStock: true },
  { id: '3', name: 'Greek Yogurt 500g', price: 380, image: '/images/products/yogurt.jpg', rating: 4.7, inStock: true },
  { id: '4', name: 'Atlantic Salmon 500g', price: 2450, discountPrice: 2190, image: '/images/products/salmon.jpg', rating: 4.8, inStock: false },
  { id: '5', name: 'Protein Bar Pack (6)', price: 1200, image: '/images/products/protein-bar.jpg', rating: 4.3, inStock: true },
  { id: '6', name: 'Honey 500ml', price: 890, image: '/images/products/honey.jpg', rating: 4.6, inStock: true },
  { id: '7', name: 'Walnuts 250g', price: 650, discountPrice: 590, image: '/images/products/walnuts.jpg', rating: 4.4, inStock: true },
  { id: '8', name: 'Avocados 4pc', price: 780, image: '/images/products/avocado.jpg', rating: 4.1, inStock: true },
];

export default function WishlistPage() {
  const [items, setItems] = useState(mockWishlist);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-secondary-800">My Wishlist</h2>
        <p className="text-sm text-muted-500">{items.length} items</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Heart className="mx-auto h-12 w-12 text-muted-300" />
          <p className="mt-4 text-lg font-semibold text-secondary-800">
            Your wishlist is empty
          </p>
          <p className="mt-1 text-sm text-muted-500">
            Save items you love for later.
          </p>
          <Button variant="primary" className="mt-4">
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const discount = item.discountPrice
              ? calculateDiscount(item.price, item.discountPrice)
              : 0;

            return (
              <div
                key={item.id}
                className="group relative rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-muted-400 shadow-sm transition-colors hover:bg-danger hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="relative mx-auto mb-4 flex h-40 items-center justify-center overflow-hidden rounded-lg bg-muted-50">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={160}
                    height={160}
                    className="object-contain"
                  />
                </div>

                <h3 className="truncate text-sm font-medium text-secondary-800">
                  {item.name}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  {item.discountPrice ? (
                    <>
                      <del className="text-xs text-muted-500">
                        {formatPrice(item.price)}
                      </del>
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(item.discountPrice)}
                      </span>
                      <span className="rounded border border-muted-200 bg-white px-1 py-0.5 text-[10px] text-muted-600">
                        {discount}% OFF
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-secondary-800">
                      {formatPrice(item.price)}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    disabled={!item.inStock}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {item.inStock ? 'Move to Cart' : 'Out of Stock'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
