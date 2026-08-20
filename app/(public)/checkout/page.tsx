'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { useCreateOrder } from '@/hooks/useOrders';
import { useTranslations } from '@/hooks/useTranslations';
import { useHydrated } from '@/hooks/useHydrated';
import { CheckCircleIcon, TruckIcon, CloseIcon, ShoppingCartIcon } from '@/components/icons';

export default function CheckoutPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const createOrder = useCreateOrder();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [zip, setZip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const total = hydrated ? items.reduce((sum, i) => sum + i.product.price * i.quantity, 0) : 0;
  const itemCount = hydrated ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  const deliveryFee = total > 2000 ? 0 : 150;
  const grandTotal = total + deliveryFee;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Required';
    if (!phone.trim()) errs.phone = 'Required';
    if (!address.trim()) errs.address = 'Required';
    if (!city.trim()) errs.city = 'Required';
    if (!province.trim()) errs.province = 'Required';
    if (!zip.trim()) errs.zip = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (paymentMethod === 'stripe') {
      setShowPaymentModal(true);
      return;
    }

    placeOrder();
  };

  const placeOrder = () => {
    const fullAddress = `${name.trim()}, ${phone.trim()}, ${address.trim()}, ${city.trim()}, ${province.trim()} ${zip.trim()}`;
    createOrder.mutate(
      { address: fullAddress, paymentMethod },
      {
        onSuccess: () => { clearCart(); setSuccess(true); setShowPaymentModal(false); },
        onError: (err) => { setErrors({ general: err.message || 'Failed to place order.' }); setShowPaymentModal(false); },
      },
    );
  };

  const inputClass = "w-full px-4 py-3 rounded-[10px] text-sm transition-all duration-300 bg-white focus:outline-none";
  const inputStyle = { border: '2px solid var(--color-border)' };

  if (items.length === 0 && !success) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
          <ShoppingCartIcon className="w-12 h-12" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Your cart is empty</h1>
        <Link
          href="/products"
          className="inline-block px-8 py-3 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(40,167,69,0.15)' }}>
          <CheckCircleIcon className="w-12 h-12" style={{ color: 'var(--color-success)' }} />
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Order Placed Successfully!</h1>
        <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
          Thank you for your order. We&apos;ll send you a confirmation shortly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/user/orders"
            className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-text-primary))' }}
          >
            View Orders
          </Link>
          <Link
            href="/products"
            className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Checkout</h1>
      <div className="w-[100px] h-1 rounded-full mb-8" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' }} />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left - Shipping + Payment (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Shipping Address */}
            <div
              className="rounded-[20px] p-6"
              style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}
            >
              <h2
                className="text-lg font-bold mb-5 pb-3 flex items-center gap-2"
                style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}
              >
                <span style={{ color: 'var(--color-primary)' }}>📦</span> Shipping Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', value: name, setter: setName, key: 'name', placeholder: 'Ahmed Khan', colSpan: false },
                  { label: 'Phone Number', value: phone, setter: setPhone, key: 'phone', placeholder: '+92 300 1234567', colSpan: false },
                  { label: 'Address', value: address, setter: setAddress, key: 'address', placeholder: '123 Main Street, Block A', colSpan: true },
                  { label: 'City', value: city, setter: setCity, key: 'city', placeholder: 'Lahore', colSpan: false },
                  { label: 'Province', value: province, setter: setProvince, key: 'province', placeholder: 'Punjab', colSpan: false },
                  { label: 'ZIP Code', value: zip, setter: setZip, key: 'zip', placeholder: '54000', colSpan: false },
                ].map((field) => (
                  <div key={field.key} className={field.colSpan ? 'sm:col-span-2' : ''}>
                    <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => { field.setter(e.target.value); setErrors((p) => ({ ...p, [field.key]: '' })); }}
                      placeholder={field.placeholder}
                      className={inputClass}
                      style={{ ...inputStyle, borderColor: errors[field.key] ? 'var(--color-error)' : 'var(--color-border)' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(122,155,118,0.2)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = errors[field.key] ? 'var(--color-error)' : 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    {errors[field.key] && <p className="text-xs mt-1" style={{ color: 'var(--color-error)' }}>{errors[field.key]}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div
              className="rounded-[20px] p-6"
              style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}
            >
              <h2
                className="text-lg font-bold mb-5 pb-3 flex items-center gap-2"
                style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}
              >
                <span style={{ color: 'var(--color-primary)' }}>💳</span> Payment Method
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: '💵' },
                  { value: 'stripe', label: 'Stripe (Card)', desc: 'Visa, Mastercard, etc.', icon: '💳' },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className="p-4 rounded-[12px] text-left transition-all duration-300 border-2"
                    style={
                      paymentMethod === method.value
                        ? { borderColor: 'var(--color-primary)', background: 'rgba(122,155,118,0.1)' }
                        : { borderColor: 'transparent', background: 'rgba(0,0,0,0.05)' }
                    }
                  >
                    <span className="text-2xl block mb-1">{method.icon}</span>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{method.label}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{method.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {errors.general && (
              <p className="text-sm rounded-lg p-3 text-center" style={{ color: 'var(--color-error)', background: 'rgba(182,92,75,0.1)', border: '1px solid var(--color-error)' }}>
                {errors.general}
              </p>
            )}
          </div>

          {/* Right - Order Summary (2 cols) */}
          <div className="lg:col-span-2">
            <div
              className="rounded-[20px] p-6 sticky top-24"
              style={{ background: 'var(--color-surface)', boxShadow: '0 25px 50px rgba(0,0,0,0.06)' }}
            >
              <h2
                className="text-lg font-bold mb-5 pb-3"
                style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}
              >
                Order Summary
              </h2>

              {/* Items */}
              <div className="flex flex-col gap-3 mb-5 max-h-[300px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                      style={{ background: 'var(--color-bg)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{item.product.name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                      Rs {(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="flex flex-col gap-2.5 text-sm pt-4" style={{ borderTop: '2px solid var(--color-primary)' }}>
                <div className="flex justify-between" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>Subtotal ({itemCount} items)</span>
                  <span>Rs {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>Delivery</span>
                  <span className="font-semibold" style={{ color: deliveryFee === 0 ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                    {deliveryFee === 0 ? 'Free' : `Rs ${deliveryFee}`}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                    Free delivery on orders above Rs 2,000
                  </p>
                )}
                <div className="flex justify-between pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Total</span>
                  <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Rs {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Place Order */}
              <button
                type="submit"
                disabled={createOrder.isPending}
                className="w-full py-3.5 mt-6 rounded-full text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                {createOrder.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Placing Order...
                  </span>
                ) : paymentMethod === 'stripe' ? 'Pay with Stripe' : 'Place Order (COD)'}
              </button>

              <Link
                href="/cart"
                className="block text-center text-sm font-semibold mt-3 transition-colors"
                style={{ color: 'var(--color-primary-dark)' }}
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </form>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(28,25,23,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-[520px] rounded-[24px] overflow-hidden"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-primary)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.06)',
            }}
          >
            {/* Modal Header */}
            <div
              className="p-5 flex items-center justify-between"
              style={{ borderBottom: '2px solid var(--color-primary)' }}
            >
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Stripe Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'var(--color-error)', color: 'white' }}
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Payment Summary */}
              <div
                className="rounded-2xl p-4 mb-6"
                style={{ background: 'rgba(10,31,68,0.08)', border: '1px solid var(--color-primary)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Amount</span>
                  <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Rs {grandTotal.toLocaleString()}</span>
                </div>
                <span
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-text-primary))',
                    color: 'var(--color-primary)',
                  }}
                >
                  Stripe
                </span>
              </div>

              {/* Stripe Form Placeholder */}
              <div
                className="rounded-xl p-5 mb-5"
                style={{ border: '2px solid var(--color-border)', background: 'white' }}
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block mb-1 text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Card Number</label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      className="w-full px-3 py-2.5 rounded-lg text-sm bg-white focus:outline-none"
                      style={{ border: '1px solid var(--color-border)' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-white focus:outline-none"
                        style={{ border: '1px solid var(--color-border)' }}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-3 py-2.5 rounded-lg text-sm bg-white focus:outline-none"
                        style={{ border: '1px solid var(--color-border)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-center mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                This is a demo Stripe form. In production, this would use Stripe Elements for secure payment processing.
              </p>

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 rounded-full text-sm font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-text-primary))' }}
                >
                  Cancel
                </button>
                <button
                  onClick={placeOrder}
                  disabled={createOrder.isPending}
                  className="flex-1 py-3 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
                >
                  {createOrder.isPending ? 'Processing...' : `Pay Rs ${grandTotal.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
