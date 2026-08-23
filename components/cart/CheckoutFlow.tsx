'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { useCartTotals } from '@/hooks/useCartTotals';
import { useAddresses, SavedAddress } from '@/hooks/useAddresses';
import { useCreateOrder, useInitiatePayment } from '@/hooks/useOrders';
import { PaymentMethods, PaymentProvider } from '@/components/checkout/PaymentMethods';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  MapPinIcon,
} from '@/components/icons';

interface AddressForm {
  name: string;
  phone: string;
  address: string;
  city: string;
}

const defaultAddress: AddressForm = { name: '', phone: '', address: '', city: '' };

const STEP_LABELS = ['Address', 'Payment', 'Review', 'Done'];

export function CheckoutFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState<AddressForm>(defaultAddress);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>('cod');
  const [error, setError] = useState('');
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const clearCart = useCartStore((s) => s.clearCart);
  const { totals, settings, couponValid } = useCartTotals();
  const { data: savedAddresses = [] } = useAddresses();
  const createOrder = useCreateOrder();
  const initiatePayment = useInitiatePayment();

  const updateAddress = (field: keyof AddressForm, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const chooseSavedAddress = (saved: SavedAddress) => {
    setSelectedAddressId(saved.id);
    setUseNewAddress(false);
    setAddress({
      name: saved.label,
      phone: saved.phone ?? '',
      address: saved.street,
      city: `${saved.city}, ${saved.state} ${saved.zip}, ${saved.country}`,
    });
  };

  const validateAddress = (): boolean => {
    if (!useNewAddress && selectedAddressId) return true;
    if (address.name.trim().length < 2) {
      setError('Please enter your full name.');
      return false;
    }
    if (!/^\+?[0-9]{10,15}$/.test(address.phone.replace(/[\s-]/g, ''))) {
      setError('Please enter a valid phone number (e.g. +92 3XX XXXXXXX).');
      return false;
    }
    if (address.address.trim().length < 5) {
      setError('Please enter your complete street address.');
      return false;
    }
    if (!address.city.trim()) {
      setError('Please enter your city.');
      return false;
    }
    return true;
  };

  const handleGatewayResult = (orderId: string) => {
    clearCart();
    setStep(4);
    void orderId;
  };

  const handlePlaceOrder = () => {
    setError('');
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    const fullAddress = `${address.name}, ${address.phone}, ${address.address}, ${address.city}`;
    const orderItems = items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      productImage: item.product.images[0] ?? '',
      price: item.product.price,
      quantity: item.quantity,
    }));

    createOrder.mutate(
      { address: fullAddress, paymentMethod, items: orderItems, couponCode },
      {
        onSuccess: async ({ order }) => {
          setPlacedOrderNumber(order.orderNumber);

          if (paymentMethod === 'cod') {
            handleGatewayResult(order.id);
            return;
          }

          try {
            const result = await initiatePayment.mutateAsync({ provider: paymentMethod, orderId: order.id });
            if (result.redirectUrl) {
              window.location.assign(result.redirectUrl);
              return;
            }
            if (result.formActionUrl && result.formFields) {
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = result.formActionUrl;
              Object.entries(result.formFields).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
              });
              document.body.appendChild(form);
              form.submit();
              return;
            }
            handleGatewayResult(order.id);
          } catch (err) {
            setError(
              err instanceof Error && err.message.includes('not configured')
                ? 'This payment method is not available right now. Please choose Cash on Delivery.'
                : err instanceof Error
                  ? err.message
                  : 'Payment could not be started. Please try another method.'
            );
          }
        },
        onError: (err) => {
          setError(err.message || 'Failed to place order. Please try again.');
        },
      }
    );
  };

  const isPlacing = createOrder.isPending || initiatePayment.isPending;

  const summaryBlock = (
    <div className="bg-bg rounded-[12px] p-4 mt-4">
      <h3 className="font-semibold text-text-primary mb-3">Order Summary</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-text-secondary">{item.product.name} x{item.quantity}</span>
            <span className="text-text-primary font-medium">PKR {(item.product.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        {totals.discount > 0 && couponValid && (
          <div className="flex justify-between text-sm text-success font-medium">
            <span>Coupon discount</span>
            <span>- PKR {totals.discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Delivery</span>
          {totals.shipping === 0 ? (
            <span className="text-success font-semibold">Free</span>
          ) : (
            <span className="text-text-primary font-medium">PKR {totals.shipping.toLocaleString()}</span>
          )}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">
            Tax{settings.taxRate > 0 ? ` (${Math.round(settings.taxRate * 100)}%)` : ''}
          </span>
          <span className="text-text-primary font-medium">PKR {totals.tax.toLocaleString()}</span>
        </div>
        <div className="border-t border-border pt-2 mt-2 flex justify-between">
          <span className="font-semibold text-text-primary">Total</span>
          <span className="font-bold text-primary-dark">PKR {totals.total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3, 4].map((s) => (
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
              {STEP_LABELS[s - 1]}
            </span>
            {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Address */}
      {step === 1 && (
        <div className="bg-surface rounded-[16px] border border-border p-6 space-y-4">
          <h2 className="text-xl font-bold text-text-primary mb-4">Delivery Address</h2>

          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <MapPinIcon className="w-4 h-4" /> Saved addresses
              </p>
              {savedAddresses.map((saved) => (
                <label
                  key={saved.id}
                  className="flex items-start gap-3 p-3 rounded-[12px] border cursor-pointer transition-colors"
                  style={{
                    borderColor:
                      !useNewAddress && selectedAddressId === saved.id
                        ? 'var(--color-primary)'
                        : 'var(--color-border)',
                    background:
                      !useNewAddress && selectedAddressId === saved.id
                        ? 'rgba(122,155,118,0.06)'
                        : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="address-choice"
                    className="mt-1"
                    checked={!useNewAddress && selectedAddressId === saved.id}
                    onChange={() => chooseSavedAddress(saved)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text-primary">
                      {saved.label}
                      {saved.isDefault && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-text-inverse">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-text-secondary">
                      {saved.street}, {saved.city}, {saved.state} {saved.zip}, {saved.country}
                      {saved.phone ? ` · ${saved.phone}` : ''}
                    </span>
                  </span>
                </label>
              ))}
              <label className="flex items-center gap-3 p-3 rounded-[12px] border border-border cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="address-choice"
                  className="mt-1"
                  checked={useNewAddress}
                  onChange={() => {
                    setUseNewAddress(true);
                    setSelectedAddressId(null);
                  }}
                />
                <span className="text-sm font-semibold text-text-primary">Use a new address</span>
              </label>
            </div>
          )}

          {(useNewAddress || savedAddresses.length === 0) && (
            <>
              <Input label="Full Name" value={address.name} onChange={(e) => updateAddress('name', e.target.value)} placeholder="Enter your name" />
              <Input label="Phone Number" value={address.phone} onChange={(e) => updateAddress('phone', e.target.value)} placeholder="+92 3XX XXXXXXX" />
              <Input label="Address" value={address.address} onChange={(e) => updateAddress('address', e.target.value)} placeholder="Street address" />
              <Input label="City" value={address.city} onChange={(e) => updateAddress('city', e.target.value)} placeholder="City" />
            </>
          )}

          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => {
                if (validateAddress()) {
                  setError('');
                  setStep(2);
                }
              }}
              size="lg"
            >
              Continue <ArrowRightIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="bg-surface rounded-[16px] border border-border p-6 space-y-4">
          <h2 className="text-xl font-bold text-text-primary mb-4">Payment Method</h2>
          <PaymentMethods value={paymentMethod} onChange={setPaymentMethod} />

          {summaryBlock}

          {error && (
            <p className="text-sm text-error" role="alert">{error}</p>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} size="lg">
              <ArrowLeftIcon className="w-5 h-5" /> Back
            </Button>
            <Button onClick={() => setStep(3)} size="lg">
              Review Order <ArrowRightIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="bg-surface rounded-[16px] border border-border p-6 space-y-4">
          <h2 className="text-xl font-bold text-text-primary mb-4">Review Your Order</h2>

          <div className="bg-bg rounded-[12px] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold text-text-primary mb-1">Deliver to</h3>
                <p className="text-sm text-text-secondary break-words">{fullAddressPreview(address)}</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-sm font-semibold text-primary-dark hover:underline whitespace-nowrap"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="bg-bg rounded-[12px] p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Paying with</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary-dark uppercase">{paymentMethod}</span>
                <button
                  onClick={() => setStep(2)}
                  className="text-sm font-semibold text-primary-dark hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>

          {summaryBlock}

          {error && (
            <p className="text-sm text-error" role="alert">{error}</p>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)} size="lg">
              <ArrowLeftIcon className="w-5 h-5" /> Back
            </Button>
            <Button onClick={handlePlaceOrder} size="lg" disabled={isPlacing}>
              {isPlacing ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div className="bg-surface rounded-[16px] border border-border p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Order Placed!</h2>
          <p className="text-text-secondary">
            Thank you for your order{placedOrderNumber ? ` ${placedOrderNumber}` : ''}. You will receive a confirmation shortly.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => router.push('/user/orders')}>
              View My Orders
            </Button>
            <Button onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function fullAddressPreview(address: AddressForm): string {
  return [address.name, address.phone, address.address, address.city]
    .filter(Boolean)
    .join(', ');
}
