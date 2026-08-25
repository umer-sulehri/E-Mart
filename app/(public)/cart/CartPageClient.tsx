'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Home, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Button from '@/components/ui/Button';
import CartSummary from '@/components/cart/CartSummary';

export default function CartPage() {
  const [clearing, setClearing] = useState(false);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const handleClearCart = () => {
    setClearing(true);
    clearCart();
    setClearing(false);
  };

  return (
    <>
      {/* Breadcrumb */}
      <section className="border-b border-muted-100 bg-white py-4">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-600">
            <Link
              href="/"
              className="flex items-center gap-1 text-muted-600 transition-colors hover:text-primary"
            >
              <Home size={14} />
              Home
            </Link>
            <ChevronRight size={12} className="text-muted-400" />
            <span className="font-medium text-secondary-800">
              Shopping Cart
            </span>
          </nav>
        </div>
      </section>

      {/* Page Title */}
      <section className="py-8 lg:py-10">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
            Shopping Cart
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="pb-12 lg:pb-16">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted-100">
                <ShoppingBag size={48} className="text-muted-400" />
              </div>
              <h2 className="mb-2 font-heading text-xl font-bold text-secondary-800">
                No items in your cart
              </h2>
              <p className="mb-6 max-w-sm text-sm text-muted-500">
                Your shopping cart is empty. Start adding items to make a purchase.
              </p>
              <Link href="/products">
                <Button variant="primary" size="lg">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Left: Cart Items Table */}
              <div className="lg:col-span-8">
                {/* Table Header (desktop) */}
                <div className="hidden border-b border-muted-200 pb-3 md:grid md:grid-cols-12 md:gap-4">
                  <div className="col-span-5 text-xs font-semibold uppercase tracking-wider text-muted-500">
                    Product
                  </div>
                  <div className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted-500">
                    Price
                  </div>
                  <div className="col-span-3 text-xs font-semibold uppercase tracking-wider text-muted-500">
                    Quantity
                  </div>
                  <div className="col-span-1 text-xs font-semibold uppercase tracking-wider text-muted-500">
                    Total
                  </div>
                  <div className="col-span-1 text-xs font-semibold uppercase tracking-wider text-muted-500">
                    Remove
                  </div>
                </div>

                {/* Cart Items */}
                <ul className="divide-y divide-muted-100">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="py-4 md:grid md:grid-cols-12 md:items-center md:gap-4"
                    >
                      {/* Product */}
                      <div className="flex items-center gap-4 md:col-span-5">
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted-50">
                          <Image
                            src={
                              item.product.images?.[0] ||
                              '/images/product-1.jpg'
                            }
                            alt={item.product.name}
                            fill
                            className="object-contain p-1"
                            sizes="80px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-sm font-medium text-secondary-800">
                            {item.product.name}
                          </h3>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mt-3 md:mt-0 md:col-span-2">
                        <span className="text-sm text-secondary-700 md:hidden">
                          Price:{' '}
                        </span>
                        <span className="text-sm font-medium text-secondary-800">
                          {formatPrice(item.unitPrice)}
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="mt-3 md:mt-0 md:col-span-3">
                        <span className="text-sm text-secondary-700 md:hidden">
                          Quantity:{' '}
                        </span>
                        <QuantitySelector
                          value={item.quantity}
                          onChange={(qty) =>
                            updateQuantity(item.productId, qty)
                          }
                          min={1}
                          max={item.product.stockQuantity}
                        />
                      </div>

                      {/* Line Total */}
                      <div className="mt-3 md:mt-0 md:col-span-1">
                        <span className="text-sm text-secondary-700 md:hidden">
                          Total:{' '}
                        </span>
                        <span className="text-sm font-bold text-secondary-800">
                          {formatPrice(item.totalPrice)}
                        </span>
                      </div>

                      {/* Remove */}
                      <div className="mt-3 md:mt-0 md:col-span-1">
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="rounded p-1.5 text-muted-400 transition-colors hover:bg-danger-50 hover:text-danger"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Bottom Actions */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-muted-100 pt-6">
                  <Link
                    href="/products"
                    className="text-sm font-medium text-secondary-700 transition-colors hover:text-primary"
                  >
                    ← Continue Shopping
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleClearCart}
                    loading={clearing}
                  >
                    <Trash2 size={14} />
                    Clear Cart
                  </Button>
                </div>
              </div>

              {/* Right: Order Summary */}
              <div className="lg:col-span-4">
                <div className="sticky top-24">
                  <CartSummary />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
