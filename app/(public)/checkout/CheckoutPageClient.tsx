'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  Home,
  Check,
  MapPin,
  CreditCard,
  Smartphone,
  Banknote,
  Truck,
  Shield,
  Lock,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { z } from 'zod';
import { useCartStore } from '@/store/cartStore';
import { useHydrated } from '@/hooks/useHydrated';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CartSummary from '@/components/cart/CartSummary';

// ──────────────────────────────────────────
// Zod Schemas
// ──────────────────────────────────────────

const shippingSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  saveDefault: z.boolean().optional(),
});

const paymentSchema = z.object({
  method: z.enum(['easypaisa', 'jazzcash', 'card', 'cod']),
  easypaisaAccount: z.string().optional(),
  jazzcashMobile: z.string().optional(),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
});

const reviewSchema = z.object({
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms & conditions' }),
  }),
});

type ShippingFormData = z.infer<typeof shippingSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;
type ReviewFormData = z.infer<typeof reviewSchema>;

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────

function fieldErrors(result: z.SafeParseReturnType<unknown, unknown>): Record<string, string> {
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

// ──────────────────────────────────────────
// Step Indicator
// ──────────────────────────────────────────

const steps = [
  { label: 'Shipping', icon: Truck },
  { label: 'Payment', icon: CreditCard },
  { label: 'Review', icon: Shield },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8 flex items-center justify-center">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        const Icon = step.icon;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                  isCompleted
                    ? 'border-primary bg-primary text-white'
                    : isActive
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-muted-200 bg-white text-muted-400'
                }`}
              >
                {isCompleted ? <Check size={18} /> : <Icon size={18} />}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${
                  isActive
                    ? 'text-primary'
                    : isCompleted
                      ? 'text-primary'
                      : 'text-muted-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`mx-2 mb-5 h-0.5 w-12 sm:w-20 ${
                  idx < currentStep ? 'bg-primary' : 'bg-muted-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────
// Shipping Form
// ──────────────────────────────────────────

function ShippingStep({
  data,
  errors,
  onChange,
  onContinue,
}: {
  data: ShippingFormData;
  errors: Record<string, string>;
  onChange: (field: keyof ShippingFormData, value: string | boolean) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-5">
      <h2 className="font-heading text-lg font-bold text-secondary-800">
        Shipping Information
      </h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="First Name"
          placeholder="Muhammad"
          value={data.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          error={errors.firstName}
        />
        <Input
          label="Last Name"
          placeholder="Ali"
          value={data.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          error={errors.lastName}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          placeholder="ali@example.com"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          error={errors.email}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="0300-1234567"
          value={data.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          error={errors.phone}
        />
      </div>

      <Input
        label="Address Line 1"
        placeholder="House #123, Street 4"
        value={data.addressLine1}
        onChange={(e) => onChange('addressLine1', e.target.value)}
        error={errors.addressLine1}
      />

      <Input
        label="Address Line 2 (Optional)"
        placeholder="Apartment, suite, etc."
        value={data.addressLine2 || ''}
        onChange={(e) => onChange('addressLine2', e.target.value)}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="City"
          placeholder="Lahore"
          value={data.city}
          onChange={(e) => onChange('city', e.target.value)}
          error={errors.city}
        />
        <Input
          label="State / Province"
          placeholder="Punjab"
          value={data.state}
          onChange={(e) => onChange('state', e.target.value)}
          error={errors.state}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Postal Code"
          placeholder="54000"
          value={data.postalCode}
          onChange={(e) => onChange('postalCode', e.target.value)}
          error={errors.postalCode}
        />
        <div className="w-full">
          <label className="mb-1.5 block text-sm font-medium text-secondary-800">
            Country
          </label>
          <select
            value={data.country}
            onChange={(e) => onChange('country', e.target.value)}
            className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="Pakistan">Pakistan</option>
            <option value="India">India</option>
            <option value="Bangladesh">Bangladesh</option>
            <option value="UAE">United Arab Emirates</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
          </select>
          {errors.country && (
            <p className="mt-1.5 text-xs text-danger">{errors.country}</p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-secondary-700">
        <input
          type="checkbox"
          checked={data.saveDefault || false}
          onChange={(e) => onChange('saveDefault', e.target.checked)}
          className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary/40"
        />
        Save as default address
      </label>

      <div className="flex justify-end pt-2">
        <Button variant="primary" size="lg" onClick={onContinue}>
          Continue to Payment
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Payment Form
// ──────────────────────────────────────────

function PaymentStep({
  data,
  errors,
  onChange,
  onSelect,
  onBack,
  onContinue,
}: {
  data: PaymentFormData;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onSelect: (method: PaymentFormData['method']) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const methods = [
    {
      id: 'easypaisa' as const,
      name: 'Easypaisa',
      icon: Smartphone,
      color: 'bg-green-50 text-green-600',
    },
    {
      id: 'jazzcash' as const,
      name: 'JazzCash',
      icon: Smartphone,
      color: 'bg-red-50 text-red-600',
    },
    {
      id: 'card' as const,
      name: 'Credit / Debit Card (Stripe)',
      icon: CreditCard,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'cod' as const,
      name: 'Cash on Delivery',
      icon: Banknote,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-lg font-bold text-secondary-800">
        Payment Method
      </h2>

      <div className="space-y-3">
        {methods.map((m) => {
          const Icon = m.icon;
          const isSelected = data.method === m.id;
          return (
            <div key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m.id)}
                className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary-50/50'
                    : 'border-muted-200 hover:border-muted-300 bg-white'
                }`}
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${m.color}`}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-secondary-800">
                    {m.name}
                  </span>
                </div>
                <div
                  className={`h-5 w-5 flex-shrink-0 rounded-full border-2 ${
                    isSelected ? 'border-primary' : 'border-muted-300'
                  }`}
                >
                  {isSelected && (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              </button>

              {/* Easypaisa details */}
              {m.id === 'easypaisa' && isSelected && (
                <div className="mt-3 ml-14">
                  <Input
                    label="Easypaisa Account Number"
                    placeholder="0300-1234567"
                    value={data.easypaisaAccount || ''}
                    onChange={(e) => onChange('easypaisaAccount', e.target.value)}
                    icon={<Smartphone size={16} />}
                  />
                </div>
              )}

              {/* JazzCash details */}
              {m.id === 'jazzcash' && isSelected && (
                <div className="mt-3 ml-14">
                  <Input
                    label="JazzCash Mobile Number"
                    placeholder="0300-1234567"
                    value={data.jazzcashMobile || ''}
                    onChange={(e) => onChange('jazzcashMobile', e.target.value)}
                    icon={<Smartphone size={16} />}
                  />
                </div>
              )}

              {/* Card details */}
              {m.id === 'card' && isSelected && (
                <div className="mt-3 ml-14 space-y-4">
                  <Input
                    label="Card Number"
                    placeholder="4242 4242 4242 4242"
                    value={data.cardNumber || ''}
                    onChange={(e) => onChange('cardNumber', e.target.value)}
                    icon={<CreditCard size={16} />}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Expiry"
                      placeholder="MM/YY"
                      value={data.cardExpiry || ''}
                      onChange={(e) => onChange('cardExpiry', e.target.value)}
                    />
                    <Input
                      label="CVC"
                      placeholder="123"
                      value={data.cardCvc || ''}
                      onChange={(e) => onChange('cardCvc', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* COD info */}
              {m.id === 'cod' && isSelected && (
                <div className="mt-3 ml-14 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                  Pay with cash upon delivery. Available for orders within Pakistan.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {errors.method && (
        <p className="text-xs text-danger">{errors.method}</p>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ChevronLeft size={16} />
          Back to Shipping
        </Button>
        <Button variant="primary" size="lg" onClick={onContinue}>
          Review Order
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Review Step
// ──────────────────────────────────────────

function ReviewStep({
  shippingData,
  paymentData,
  errors,
  orderError,
  onChange,
  onBack,
  goToShipping,
  goToPayment,
}: {
  shippingData: ShippingFormData;
  paymentData: PaymentFormData;
  errors: Record<string, string>;
  orderError: string | null;
  onChange: (value: boolean) => void;
  onBack: () => void;
  goToShipping: () => void;
  goToPayment: () => void;
}) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const shippingCost = useCartStore((s) => s.shippingCost);
  const total = useCartStore((s) => s.total);

  const hydrated = useHydrated();
  const shownItems = hydrated ? items : [];

  const currentSubtotal = subtotal();
  const currentShipping = shippingCost();
  const currentTotal = total();

  const paymentLabel = useMemo(() => {
    switch (paymentData.method) {
      case 'easypaisa':
        return 'Easypaisa';
      case 'jazzcash':
        return 'JazzCash';
      case 'card':
        return 'Credit / Debit Card';
      case 'cod':
        return 'Cash on Delivery';
      default:
        return '';
    }
  }, [paymentData.method]);

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
            <span className="font-medium">{formatPrice(currentSubtotal)}</span>
          </div>
          <div className="flex justify-between text-secondary-700">
            <span>Shipping</span>
            <span className="font-medium">
              {currentShipping === 0 ? (
                <span className="text-success">Free</span>
              ) : (
                formatPrice(currentShipping)
              )}
            </span>
          </div>
          <div className="flex justify-between border-t border-muted-100 pt-2">
            <span className="font-bold text-secondary-800">Total</span>
            <span className="font-bold text-primary">
              {formatPrice(currentTotal)}
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

// ──────────────────────────────────────────
// Main Checkout Page
// ──────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const couponCode = useCartStore((s) => s.couponCode);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const [currentStep, setCurrentStep] = useState(0);
  const [placeOrderLoading, setPlaceOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [shippingData, setShippingData] = useState<ShippingFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    saveDefault: false,
  });

  const [paymentData, setPaymentData] = useState<PaymentFormData>({
    method: 'cod',
  });

  const [termsAccepted, setTermsAccepted] = useState(false);

  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});

  // Handlers
  const handleShippingChange = (
    field: keyof ShippingFormData,
    value: string | boolean
  ) => {
    setShippingData((prev) => ({ ...prev, [field]: value }));
    setShippingErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handlePaymentChange = (field: string, value: string) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentSelect = (method: PaymentFormData['method']) => {
    setPaymentData((prev) => ({ ...prev, method }));
    setPaymentErrors({});
  };

  const handleContinueToPayment = () => {
    const result = shippingSchema.safeParse(shippingData);
    const errs = fieldErrors(result);
    setShippingErrors(errs);
    if (Object.keys(errs).length === 0) {
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleContinueToReview = () => {
    const result = paymentSchema.safeParse(paymentData);
    const errs = fieldErrors(result);
    setPaymentErrors(errs);
    if (Object.keys(errs).length === 0) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePlaceOrder = async () => {
    const result = reviewSchema.safeParse({ acceptTerms: termsAccepted });
    const errs = fieldErrors(result);
    setReviewErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPlaceOrderLoading(true);
    setOrderError(null);

    try {
      // Step 1: Save shipping address
      const addressRes = await fetch('/api/v1/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: shippingData.firstName,
          lastName: shippingData.lastName,
          email: shippingData.email,
          phone: shippingData.phone,
          addressLine1: shippingData.addressLine1,
          addressLine2: shippingData.addressLine2,
          city: shippingData.city,
          state: shippingData.state,
          postalCode: shippingData.postalCode,
          country: shippingData.country,
        }),
      });

      const addressResult = await addressRes.json();
      if (!addressResult.success) {
        throw new Error(addressResult.error || 'Failed to save shipping address');
      }

      const shippingAddressId = addressResult.data.id;

      // Step 2: Create order
      const paymentMethodMap: Record<string, string> = {
        easypaisa: 'easypaisa',
        jazzcash: 'jazzcash',
        card: 'stripe',
        cod: 'cod',
      };

      const orderRes = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddressId,
          paymentMethod: paymentMethodMap[paymentData.method] || 'cod',
          couponCode: couponCode || null,
          discountAmount: discountAmount() || 0,
        }),
      });

      const orderResult = await orderRes.json();
      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      const order = orderResult.data;
      const orderId = order.id;
      const orderNumber = order.order_number || orderId;
      const orderTotal = order.total;

      // Step 3: Initiate payment based on method
      switch (paymentData.method) {
        case 'easypaisa': {
          const epRes = await fetch('/api/v1/payments/easypaisa/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              mobileNumber: (paymentData.easypaisaAccount || shippingData.phone).replace(/[-\s]/g, ''),
              amount: orderTotal,
            }),
          });
          const epResult = await epRes.json();
          if (!epResult.success) throw new Error(epResult.error || 'Easypaisa payment initiation failed');
          clearCart();
          if (epResult.data?.paymentUrl) {
            window.location.href = epResult.data.paymentUrl;
          } else {
            router.push(`/checkout/success?orderId=${orderId}&orderNumber=${orderNumber}`);
          }
          return;
        }

        case 'jazzcash': {
          const jcRes = await fetch('/api/v1/payments/jazzcash/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              mobileNumber: (paymentData.jazzcashMobile || shippingData.phone).replace(/[-\s]/g, ''),
              amount: orderTotal,
            }),
          });
          const jcResult = await jcRes.json();
          if (!jcResult.success) throw new Error(jcResult.error || 'JazzCash payment initiation failed');
          clearCart();
          if (jcResult.data?.redirectUrl) {
            window.location.href = jcResult.data.redirectUrl;
          } else {
            router.push(`/checkout/success?orderId=${orderId}&orderNumber=${orderNumber}`);
          }
          return;
        }

        case 'card': {
          const stripeRes = await fetch('/api/v1/payments/stripe/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId,
              successUrl: `${window.location.origin}/checkout/success?orderId=${orderId}&orderNumber=${orderNumber}`,
              cancelUrl: `${window.location.origin}/checkout`,
            }),
          });
          const stripeResult = await stripeRes.json();
          if (!stripeResult.success) throw new Error(stripeResult.error || 'Stripe payment initiation failed');
          clearCart();
          if (stripeResult.data?.url) {
            window.location.href = stripeResult.data.url;
          } else {
            router.push(`/checkout/success?orderId=${orderId}&orderNumber=${orderNumber}`);
          }
          return;
        }

        case 'cod': {
          const codRes = await fetch('/api/v1/payments/cod', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          });
          const codResult = await codRes.json();
          if (!codResult.success) throw new Error(codResult.error || 'COD confirmation failed');
          clearCart();
          router.push(`/checkout/success?orderId=${orderId}&orderNumber=${orderNumber}`);
          return;
        }

        default:
          throw new Error('Invalid payment method');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setOrderError(message);
      setPlaceOrderLoading(false);
    }
  };

  // Empty cart guard
  if (items.length === 0) {
    return (
      <>
        <section className="border-b border-muted-100 bg-white py-4">
          <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-600">
              <Link
                href="/"
                className="flex items-center gap-1 text-muted-600 transition-colors hover:text-primary"
              >
                <Home size={14} />
                Home
              </Link>
              <ChevronRight size={12} className="text-muted-400" />
              <span className="font-medium text-secondary-800">Checkout</span>
            </nav>
          </div>
        </section>
        <section className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted-100">
            <ShoppingBag size={48} className="text-muted-400" />
          </div>
          <h2 className="mb-2 font-heading text-xl font-bold text-secondary-800">
            Your cart is empty
          </h2>
          <p className="mb-6 max-w-sm text-sm text-muted-500">
            Add some products before proceeding to checkout.
          </p>
          <Link href="/products">
            <Button variant="primary" size="lg">
              Start Shopping
            </Button>
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <section className="border-b border-muted-100 bg-white py-4">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-600">
            <Link
              href="/"
              className="flex items-center gap-1 text-muted-600 transition-colors hover:text-primary"
            >
              <Home size={14} />
              Home
            </Link>
            <ChevronRight size={12} className="text-muted-400" />
            <Link
              href="/cart"
              className="text-muted-600 transition-colors hover:text-primary"
            >
              Cart
            </Link>
            <ChevronRight size={12} className="text-muted-400" />
            <span className="font-medium text-secondary-800">Checkout</span>
          </nav>
        </div>
      </section>

      {/* Page Title */}
      <section className="py-8 lg:py-10">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
            Checkout
          </h1>
        </div>
      </section>

      {/* Step Indicator */}
      <section>
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <StepIndicator currentStep={currentStep} />
        </div>
      </section>

      {/* Content */}
      <section className="pb-12 lg:pb-16">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left: Form */}
            <div className="lg:col-span-8">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                {currentStep === 0 && (
                  <ShippingStep
                    data={shippingData}
                    errors={shippingErrors}
                    onChange={handleShippingChange}
                    onContinue={handleContinueToPayment}
                  />
                )}
                {currentStep === 1 && (
                  <PaymentStep
                    data={paymentData}
                    errors={paymentErrors}
                    onChange={handlePaymentChange}
                    onSelect={handlePaymentSelect}
                    onBack={() => {
                      setCurrentStep(0);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onContinue={handleContinueToReview}
                  />
                )}
                {currentStep === 2 && (
                  <ReviewStep
                    shippingData={shippingData}
                    paymentData={paymentData}
                    errors={reviewErrors}
                    orderError={orderError}
                    onChange={(val) => {
                      setTermsAccepted(val);
                      setReviewErrors((prev) => {
                        const next = { ...prev };
                        delete next.acceptTerms;
                        return next;
                      });
                    }}
                    onBack={() => {
                      setCurrentStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    goToShipping={() => {
                      setCurrentStep(0);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    goToPayment={() => {
                      setCurrentStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <CartSummary
                  isCheckout={currentStep === 2}
                  onPlaceOrder={currentStep === 2 ? handlePlaceOrder : undefined}
                  placeOrderLoading={placeOrderLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


