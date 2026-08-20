'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { useCreateOrder } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '@/components/icons';

interface AddressForm {
  name: string;
  phone: string;
  address: string;
  city: string;
}

const defaultAddress: AddressForm = { name: '', phone: '', address: '', city: '' };

export function CheckoutFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState<AddressForm>(defaultAddress);
  const [paymentMethod] = useState('cod');
  const [error, setError] = useState('');
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const clearCart = useCartStore((s) => s.clearCart);
  const createOrder = useCreateOrder();

  const updateAddress = (field: keyof AddressForm, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = () => {
    const fullAddress = `${address.address}, ${address.city}`;
    setError('');
    createOrder.mutate(
      { address: fullAddress, paymentMethod },
      {
        onSuccess: () => {
          clearCart();
          setStep(3);
        },
        onError: (err) => {
          setError(err.message || 'Failed to place order. Please try again.');
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s
                  ? 'bg-primary text-text-inverse'
                  : 'bg-surface text-text-secondary border border-border'
              }`}
            >
              {s}
            </div>
            <span className={`text-sm font-medium hidden sm:inline ${step >= s ? 'text-primary-dark' : 'text-text-secondary'}`}>
              {s === 1 ? 'Address' : s === 2 ? 'Payment' : 'Done'}
            </span>
            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-surface rounded-[16px] border border-border p-6 space-y-4">
          <h2 className="text-xl font-bold text-text-primary mb-4">Delivery Address</h2>
          <Input label="Full Name" value={address.name} onChange={(e) => updateAddress('name', e.target.value)} placeholder="Enter your name" />
          <Input label="Phone Number" value={address.phone} onChange={(e) => updateAddress('phone', e.target.value)} placeholder="+92 3XX XXXXXXX" />
          <Input label="Address" value={address.address} onChange={(e) => updateAddress('address', e.target.value)} placeholder="Street address" />
          <Input label="City" value={address.city} onChange={(e) => updateAddress('city', e.target.value)} placeholder="City" />
          <div className="flex justify-end pt-2">
            <Button onClick={() => setStep(2)} size="lg">
              Continue <ArrowRightIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-surface rounded-[16px] border border-border p-6 space-y-4">
          <h2 className="text-xl font-bold text-text-primary mb-4">Payment Method</h2>
          <div className="bg-bg border-2 border-primary rounded-[12px] p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-4 border-primary" />
              <div>
                <p className="font-semibold text-text-primary">Cash on Delivery</p>
                <p className="text-sm text-text-secondary">Pay when you receive your order</p>
              </div>
            </div>
          </div>

          <div className="bg-bg rounded-[12px] p-4 mt-4">
            <h3 className="font-semibold text-text-primary mb-3">Order Summary</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{item.product.name} x{item.quantity}</span>
                  <span className="text-text-primary font-medium">PKR {(item.product.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-2 flex justify-between">
                <span className="font-semibold text-text-primary">Total</span>
                <span className="font-bold text-primary-dark">PKR {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-error" role="alert">{error}</p>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} size="lg">
              <ArrowLeftIcon className="w-5 h-5" /> Back
            </Button>
            <Button onClick={handlePlaceOrder} size="lg" disabled={createOrder.isPending}>
              {createOrder.isPending ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-surface rounded-[16px] border border-border p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Order Placed!</h2>
          <p className="text-text-secondary">Thank you for your order. You will receive a confirmation shortly.</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
}
