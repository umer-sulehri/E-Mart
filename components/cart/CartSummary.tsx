'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tag, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useHydrated } from '@/hooks/useHydrated';
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
  const [applying, setApplying] = useState(false);

  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const subtotal = useCartStore((s) => s.subtotal);
  const taxAmount = useCartStore((s) => s.taxAmount);
  const shippingCost = useCartStore((s) => s.shippingCost);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const total = useCartStore((s) => s.total);

  const currentSubtotal = subtotal();
  const currentTax = taxAmount();
  const currentShipping = shippingCost();
  const currentDiscount = discountAmount();
  const currentTotal = total();

  const hydrated = useHydrated();
  const shownItems = hydrated ? items : [];

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code || applying) return;

    setApplying(true);
    try {
      const res = await fetch('/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error || 'Invalid coupon code');
        return;
      }

      const data = json.data;
      let discount = 0;
      if (data.coupon.type === 'percentage') {
        discount = Math.round(
          (currentSubtotal * data.coupon.value) / 100
        );
        if (data.coupon.maximumDiscountAmount) {
          discount = Math.min(
            discount,
            data.coupon.maximumDiscountAmount
          );
        }
      } else if (data.coupon.type === 'fixed_amount') {
        discount = data.coupon.value;
      }

      discount = Math.min(discount, currentSubtotal);
      applyCoupon(data.coupon.code, discount);
      setPromoApplied(true);
      toast.success(data.message || 'Coupon applied');
    } catch {
      toast.error('Unable to apply coupon');
    } finally {
      setApplying(false);
    }
  };

  const handleRemovePromo = () => {
    removeCoupon();
    setPromoCode('');
    setPromoApplied(false);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-heading text-lg font-bold text-secondary-800">
        Order Summary
      </h2>

      {/* Items List */}
      <ul className="mb-4 max-h-48 space-y-3 overflow-y-auto">
        {shownItems.map((item) => (
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

        {/* Tax */}
        <div className="flex items-center justify-between text-secondary-700">
          <span>Estimated Tax</span>
          <span className="font-medium">{formatPrice(currentTax)}</span>
        </div>

        {/* Discount */}
        {currentDiscount > 0 && (
          <div className="flex items-center justify-between text-success">
            <span>
              Discount{couponCode ? ` (${couponCode})` : ''}
            </span>
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
      {!isCheckout &&
        (promoApplied && couponCode ? (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 font-medium text-primary">
              <Tag size={14} />
              {couponCode}
            </span>
            <button
              onClick={handleRemovePromo}
              className="rounded p-1 text-muted-500 transition-colors hover:bg-primary-100"
              aria-label="Remove coupon"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
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
              disabled={!promoCode.trim() || applying}
              loading={applying}
            >
              Apply
            </Button>
          </div>
        ))}

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
