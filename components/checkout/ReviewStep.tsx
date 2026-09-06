'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { MapPin, CreditCard, ChevronLeft } from 'lucide-react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import Button from '@/components/ui/Button';
import { useCartStore } from '@/store/cartStore';
import { useHydrated } from '@/hooks/useHydrated';
import { formatPrice } from '@/lib/utils';
import { PAYMENT_LABELS, type ShippingFormData, type PaymentFormData } from '@/lib/checkout';

interface ReviewStepProps {
  shippingData: ShippingFormData;
  paymentData: PaymentFormData;
  errors: Record<string, string>;
  orderError: string | null;
  onChange: (value: boolean) => void;
  onBack: () => void;
  goToShipping: () => void;
  goToPayment: () => void;
}

export default function ReviewStep({
  shippingData,
  paymentData,
  errors,
  orderError,
  onChange,
  onBack,
  goToShipping,
  goToPayment,
}: ReviewStepProps) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const shippingCost = useCartStore((s) => s.shippingCost);
  const total = useCartStore((s) => s.total);

  const hydrated = useHydrated();
  const shownItems = hydrated ? items : [];

  const currentSubtotal = subtotal();
  const currentShipping = shippingCost();
  const currentTotal = total();

  const shownSubtotal = hydrated ? currentSubtotal : 0;
  const shownShipping = hydrated ? currentShipping : 0;
  const shownTotal = hydrated ? currentTotal : 0;

  const paymentLabel = useMemo(
    () => PAYMENT_LABELS[paymentData.method] ?? '',
    [paymentData.method]
  );

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-lg font-bold text-secondary-800">
        Review Your Order
      </h2>

      {/* Shipping Address */}
      <div className="rounded-xl border border-muted-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary-800">
            <MapPin size={16} className="text-primary" />
            Shipping Address
          </h3>
          <button
            type="button"
            onClick={goToShipping}
            className="text-xs font-medium text-primary transition-colors hover:text-primary-500"
          >
            Edit
          </button>
        </div>
        <div className="text-sm text-secondary-700">
          <p className="font-medium">
            {shippingData.firstName} {shippingData.lastName}
          </p>
          <p>{shippingData.addressLine1}</p>
          {shippingData.addressLine2 && <p>{shippingData.addressLine2}</p>}
          <p>
            {shippingData.city}, {shippingData.state} {shippingData.postalCode}
          </p>
          <p>{shippingData.country}</p>
          <p className="mt-1 text-muted-500">
            {shippingData.email} · {shippingData.phone}
          </p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-xl border border-muted-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary-800">
            <CreditCard size={16} className="text-primary" />
            Payment Method
          </h3>
          <button
            type="button"
            onClick={goToPayment}
            className="text-xs font-medium text-primary transition-colors hover:text-primary-500"
          >
            Edit
          </button>
        </div>
        <p className="text-sm text-secondary-700">{paymentLabel}</p>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-muted-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-secondary-800">
          Order Items ({shownItems.length})
        </h3>
        <ul className="divide-y divide-muted-100">
          {shownItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted-50">
                <ImageWithFallback
                  src={item.product.images?.[0]}
                  alt={item.product.name}
                  fill
                  className="object-contain p-0.5"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-secondary-800">
                  {item.product.name}
                </p>
                <p className="text-xs text-muted-500">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-secondary-800">
                {formatPrice(item.totalPrice)}
              </span>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="mt-4 space-y-2 border-t border-muted-100 pt-4 text-sm">
          <div className="flex justify-between text-secondary-700">
            <span>Subtotal</span>
            <span className="font-medium">{formatPrice(shownSubtotal)}</span>
          </div>
          <div className="flex justify-between text-secondary-700">
            <span>Shipping</span>
            <span className="font-medium">
              {shownShipping === 0 ? (
                <span className="text-success">Free</span>
              ) : (
                formatPrice(shownShipping)
              )}
            </span>
          </div>
          <div className="flex justify-between border-t border-muted-100 pt-2">
            <span className="font-bold text-secondary-800">Total</span>
            <span className="font-bold text-primary">
              {formatPrice(shownTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-3 rounded-xl border border-muted-200 p-4">
        <input
          type="checkbox"
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary/40"
        />
        <span className="text-sm text-secondary-700">
          I agree to the{' '}
          <Link href="/terms" className="font-medium text-primary hover:text-primary-500">
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link href="/privacy-policy" className="font-medium text-primary hover:text-primary-500">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {errors.acceptTerms && (
        <p className="text-xs text-danger">{errors.acceptTerms}</p>
      )}

      {orderError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {orderError}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ChevronLeft size={16} />
          Back to Payment
        </Button>
      </div>
    </div>
  );
}