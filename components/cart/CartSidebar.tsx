'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { formatPrice } from '@/lib/utils';
import { resolveImage } from '@/lib/imageLoader';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Button from '@/components/ui/Button';

export default function CartSidebar() {
  const isCartOpen = useUIStore((s) => s.isCartOpen);
  const toggleCart = useUIStore((s) => s.toggleCart);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal);
  const shippingCost = useCartStore((s) => s.shippingCost);
  const total = useCartStore((s) => s.total);
  const itemCount = useCartStore((s) => s.itemCount);

  const handleToggle = useCallback(() => {
    toggleCart();
  }, [toggleCart]);

  useEffect(() => {
    const handler = () => handleToggle();
    window.addEventListener('toggle-cart', handler);
    return () => window.removeEventListener('toggle-cart', handler);
  }, [handleToggle]);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const currentSubtotal = subtotal();
  const currentShipping = shippingCost();
  const currentTotal = total();
  const currentItemCount = itemCount();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={handleToggle}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-muted-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-secondary-800">
              Shopping Cart
            </h2>
            {currentItemCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                {currentItemCount}
              </span>
            )}
          </div>
          <button
            onClick={handleToggle}
            className="rounded-lg p-2 text-muted-500 transition-colors hover:bg-muted-50 hover:text-secondary-800"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items List */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted-100">
              <ShoppingBag size={36} className="text-muted-400" />
            </div>
            <p className="text-sm font-medium text-secondary-800">
              Your cart is empty
            </p>
            <Button
              variant="primary"
              onClick={handleToggle}
              className="mt-2"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: '60vh' }}>
              <ul className="divide-y divide-muted-100">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-4">
                    {/* Thumbnail */}
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted-50">
                      <ImageWithFallback
                        src={resolveImage(item.product.images?.[0])}
                        alt={item.product.name}
                        fill
                        className="object-contain p-1"
                        sizes="80px"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="line-clamp-2 text-sm font-medium text-secondary-800">
                          {item.product.name}
                        </h3>
                        <p className="mt-0.5 text-sm font-semibold text-primary">
                          {formatPrice(item.unitPrice)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <QuantitySelector
                          value={item.quantity}
                          onChange={(qty) =>
                            updateQuantity(item.productId, qty)
                          }
                          min={1}
                          max={item.product.stockQuantity}
                        />
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="rounded p-1.5 text-muted-400 transition-colors hover:bg-danger-50 hover:text-danger"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-secondary-800">
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="border-t border-muted-200 px-6 py-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-secondary-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatPrice(currentSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-secondary-700">
                  <span>Shipping</span>
                  <span className="font-semibold">
                    {currentShipping === 0 ? (
                      <span className="text-success">Free</span>
                    ) : (
                      formatPrice(currentShipping)
                    )}
                  </span>
                </div>
                {currentShipping > 0 && (
                  <p className="text-xs text-muted-500">
                    Free shipping above {formatPrice(5000)}
                  </p>
                )}
                <div className="border-t border-muted-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-secondary-800">Total</span>
                    <span className="text-base font-bold text-primary">
                      {formatPrice(currentTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <Link href="/checkout" onClick={handleToggle}>
                <Button variant="primary" className="mt-4 w-full" size="lg">
                  Proceed to Checkout
                </Button>
              </Link>

              <button
                onClick={handleToggle}
                className="mt-3 w-full text-center text-sm font-medium text-secondary-700 transition-colors hover:text-primary"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
