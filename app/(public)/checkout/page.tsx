'use client';

import { CheckoutFlow } from '@/components/cart/CheckoutFlow';

export default function CheckoutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-text-primary">Checkout</h1>
      <div className="w-[100px] h-1 rounded-full mb-8 bg-primary" />
      <CheckoutFlow />
    </div>
  );
}
