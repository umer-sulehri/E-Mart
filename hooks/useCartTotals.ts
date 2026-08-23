'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { useCartStore } from '@/lib/store/cartStore';
import { useHydrated } from '@/hooks/useHydrated';

export interface StoreSettingsPublic {
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
}

interface CouponResponse {
  valid: boolean;
  reason?: string;
  code?: string;
  discount: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

const FALLBACK_SETTINGS: StoreSettingsPublic = {
  taxRate: 0,
  shippingFee: 150,
  freeShippingThreshold: 2000,
};

function compute(
  subtotal: number,
  settings: StoreSettingsPublic,
  discount: number
): CartTotals {
  const safeDiscount = Math.min(Math.max(0, Math.round(discount)), subtotal);
  const discountedSubtotal = subtotal - safeDiscount;
  const shipping =
    discountedSubtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const tax = Math.round(discountedSubtotal * settings.taxRate * 100) / 100;
  return {
    subtotal,
    discount: safeDiscount,
    shipping,
    tax,
    total: discountedSubtotal + shipping + tax,
  };
}

/**
 * Shared cart math for the cart and checkout pages. Mirrors the
 * server-authoritative computation in POST /api/v1/orders.
 */
export function useCartTotals() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['storeSettings'],
    queryFn: () => apiFetch<StoreSettingsPublic>('/settings/public'),
    staleTime: 5 * 60 * 1000,
  });
  const effectiveSettings = settings ?? FALLBACK_SETTINGS;

  const subtotal = hydrated ? items.reduce((sum, i) => sum + i.product.price * i.quantity, 0) : 0;

  // Re-validate the stored coupon against the current subtotal.
  const { data: validation } = useQuery({
    queryKey: ['coupon', couponCode, subtotal],
    queryFn: () =>
      apiFetch<CouponResponse>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode, subtotal }),
      }),
    enabled: hydrated && !!couponCode && subtotal > 0,
    retry: false,
  });

  const validDiscount = validation?.valid ? validation.discount : 0;

  const applyCoupon = useMutation({
    mutationFn: (code: string) =>
      apiFetch<CouponResponse>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal }),
      }),
    onSuccess: (result) => {
      if (result.valid && result.code) {
        setCoupon(result.code);
        queryClient.invalidateQueries({ queryKey: ['coupon'] });
      }
    },
  });

  const removeCoupon = () => setCoupon(null);

  const totals = compute(subtotal, effectiveSettings, validDiscount);

  return {
    items,
    hydrated,
    subtotal,
    itemCount: hydrated ? items.reduce((sum, i) => sum + i.quantity, 0) : 0,
    settings: effectiveSettings,
    couponCode,
    couponValid: validation?.valid ?? false,
    couponError: validation?.valid ? undefined : validation?.reason,
    isValidatingCoupon: !validation && !!couponCode,
    applyCoupon,
    removeCoupon,
    totals,
  };
}
