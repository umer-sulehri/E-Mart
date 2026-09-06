'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Home, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useHydrated } from '@/hooks/useHydrated';
import Button from '@/components/ui/Button';
import CartSummary from '@/components/cart/CartSummary';
import StepIndicator from '@/components/checkout/StepIndicator';
import ShippingStep from '@/components/checkout/ShippingStep';
import PaymentStep from '@/components/checkout/PaymentStep';
import ReviewStep from '@/components/checkout/ReviewStep';
import {
  shippingSchema,
  paymentSchema,
  reviewSchema,
  fieldErrors,
  type ShippingFormData,
  type PaymentFormData,
} from '@/lib/checkout';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const couponCode = useCartStore((s) => s.couponCode);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const hydrated = useHydrated();
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
          isDefault: shippingData.saveDefault ?? false,
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

  // Empty cart guard (gated on hydration so the empty state matches server output on first render)
  if (!hydrated || items.length === 0) {
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


