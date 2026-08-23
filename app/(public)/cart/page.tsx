'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cartStore';
import { useCartTotals } from '@/hooks/useCartTotals';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ShoppingCartIcon,
  TagIcon,
} from '@/components/icons';

export default function CartPage() {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const {
    items,
    hydrated,
    itemCount,
    settings,
    couponCode,
    couponValid,
    couponError,
    isValidatingCoupon,
    applyCoupon,
    removeCoupon,
    totals,
  } = useCartTotals();
  const [couponInput, setCouponInput] = useState('');

  if (hydrated && items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-surface rounded-full flex items-center justify-center">
          <ShoppingCartIcon className="w-12 h-12 text-text-secondary" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">Your cart is empty</h1>
        <p className="text-text-secondary mb-6">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/products">
          <Button size="lg">Browse Products</Button>
        </Link>
      </div>
    );
  }

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    applyCoupon.mutate(couponInput.trim(), {
      onSuccess: (result) => {
        if (result.valid) setCouponInput('');
      },
    });
  };

  const amountToFreeShipping = Math.max(0, settings.freeShippingThreshold - (totals.subtotal - totals.discount));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex gap-4">
                <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-[10px] bg-surface-alt"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`} className="text-sm font-semibold text-text-primary hover:text-primary-dark line-clamp-2">
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-text-secondary mt-1">{item.product.category?.name ?? ''}</p>
                  <p className="text-base font-bold text-text-primary mt-2">
                    Rs {item.product.price.toLocaleString()}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full border border-border bg-bg hover:bg-surface-alt transition-colors"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                      {item.quantity >= item.product.stock && (
                        <span className="text-[10px] text-text-secondary whitespace-nowrap">Max stock</span>
                      )}
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        aria-label="Increase quantity"
                        disabled={item.quantity >= item.product.stock}
                        className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full border border-border bg-bg hover:bg-surface-alt transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {/* Line subtotal */}
                      <span className="text-sm font-bold text-text-primary whitespace-nowrap">
                        Rs {(item.product.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remove ${item.product.name} from cart`}
                        className="min-w-[48px] min-h-[48px] flex items-center justify-center text-error hover:bg-error/10 rounded-full transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h2 className="text-lg font-bold text-text-primary mb-4">Order Summary</h2>

            {/* Coupon */}
            {couponCode && couponValid ? (
              <div className="flex items-center justify-between bg-success/10 rounded-[10px] px-3 py-2 mb-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-success">
                  <TagIcon className="w-4 h-4" /> {couponCode}
                </span>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-semibold text-error hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                    maxLength={50}
                    className="flex-1 min-w-0 px-3 py-2 text-sm rounded-[10px] border border-border bg-bg focus:outline-none focus:ring-2"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={!couponInput.trim() || applyCoupon.isPending}
                  >
                    Apply
                  </Button>
                </div>
                {(couponError || applyCoupon.isError) && (
                  <p className="text-xs text-error mt-1" role="alert">
                    {couponError ?? 'Could not apply that coupon.'}
                  </p>
                )}
                {isValidatingCoupon && (
                  <p className="text-xs text-text-secondary mt-1">Checking coupon…</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal ({itemCount} items)</span>
                <span>Rs {totals.subtotal.toLocaleString()}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-success font-medium">
                  <span>Coupon discount</span>
                  <span>- Rs {totals.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Delivery</span>
                {totals.shipping === 0 ? (
                  <span className="text-success font-semibold">Free</span>
                ) : (
                  <span>Rs {totals.shipping.toLocaleString()}</span>
                )}
              </div>
              {amountToFreeShipping > 0 && (
                <p className="text-xs text-text-secondary -mt-1">
                  Add Rs {amountToFreeShipping.toLocaleString()} more for free delivery.
                </p>
              )}
              <div className="flex justify-between text-text-secondary">
                <span>Tax{settings.taxRate > 0 ? ` (${Math.round(settings.taxRate * 100)}%)` : ''}</span>
                <span>Rs {totals.tax.toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-base font-bold text-text-primary">Total</span>
                <span className="text-base font-bold text-text-primary">Rs {totals.total.toLocaleString()}</span>
              </div>
            </div>
            <Link href="/checkout" className="block">
              <Button className="w-full mt-6" size="lg">
                Proceed to Checkout
              </Button>
            </Link>
            <Link href="/products" className="block text-center text-sm text-primary-dark font-semibold mt-3 hover:underline">
              Continue Shopping
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
