'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/store/cartStore';
import { useHydrated } from '@/hooks/useHydrated';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PlusIcon, MinusIcon, TrashIcon, ShoppingCartIcon } from '@/components/icons';

export default function CartPage() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const total = hydrated ? items.reduce((sum, i) => sum + i.product.price * i.quantity, 0) : 0;
  const itemCount = hydrated ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  if (items.length === 0) {
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
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full border border-border bg-bg hover:bg-surface-alt transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
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
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h2 className="text-lg font-bold text-text-primary mb-4">Order Summary</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal ({itemCount} items)</span>
                <span>Rs {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Delivery</span>
                <span className="text-success font-semibold">Free</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-base font-bold text-text-primary">Total</span>
                <span className="text-base font-bold text-text-primary">Rs {total.toLocaleString()}</span>
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
