'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tag, Lock } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface CartSummaryProps {
  /** When true, shows "Place Order" instead of "Proceed to Checkout" and hides the link */
  isCheckout?: boolean;
  onPlaceOrder?: () => void;
  placeOrderLoading?: boolean;
}

export default function CartSummary({
  isCheckout = false,
  onPlaceOrder,
  placeOrderLoading = false,
}: CartSummaryProps) {
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const shippingCost = useCartStore((s) => s.shippingCost);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const total = useCartStore((s) => s.total);

  const currentSubtotal = subtotal();
  const currentShipping = shippingCost();
  const currentDiscount = discountAmount();
  const currentTotal = total();

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      setPromoApplied(true);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-heading text-lg font-bold text-secondary-800">
        Order Summary
      </h2>

      {/* Items List */}
      <ul className="mb-4 max-h-48 space-y-3 overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex-1 truncate text-secondary-700">
              {item.product.name}
              <span className="ml-1 text-muted-500">× {item.quantity}</span>
            </span>
            <span className="ml-3 flex-shrink-0 font-medium text-secondary-800">
              {formatPrice(item.totalPrice)}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-muted-100 pt-4 text-sm">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-secondary-700">
          <span>Subtotal</span>
          <span className="font-medium">{formatPrice(currentSubtotal)}</span>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between text-secondary-700">
          <span>Shipping</span>
          <span className="font-medium">
            {currentShipping === 0 ? (
              <span className="text-success">Free</span>
            ) : (
              formatPrice(currentShipping)
            )}
          </span>
        </div>

        {/* Tax placeholder */}
        <div className="flex items-center justify-between text-secondary-700">
          <span>Estimated Tax</span>
          <span className="font-medium text-muted-400">{formatPrice(0)}</span>
        </div>

        {/* Discount */}
        {currentDiscount > 0 && (
          <div className="flex items-center justify-between text-success">
            <span>Discount</span>
            <span className="font-medium">-{formatPrice(currentDiscount)}</span>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-muted-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-secondary-800">
              Total
            </span>
            <span className="text-base font-bold text-primary">
              {formatPrice(currentTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Promo Code */}
      {!isCheckout && (
        <div className="mt-4 flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Promo code"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                setPromoApplied(false);
              }}
              icon={<Tag size={16} />}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleApplyPromo}
            disabled={!promoCode.trim()}
          >
            Apply
          </Button>
        </div>
      )}

      {/* CTA Button */}
      {isCheckout ? (
        <Button
          variant="primary"
          size="lg"
          className="mt-4 w-full"
          onClick={onPlaceOrder}
          loading={placeOrderLoading}
          disabled={items.length === 0}
        >
          <Lock size={16} />
          Place Order
        </Button>
      ) : (
        <Link href="/checkout">
          <Button variant="primary" size="lg" className="mt-4 w-full" disabled={items.length === 0}>
            Proceed to Checkout
          </Button>
        </Link>
      )}

      {/* Trust note */}
      <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-500">
        <Lock size={12} />
        <span>Secure checkout guaranteed</span>
      </div>
    </div>
  );
}
