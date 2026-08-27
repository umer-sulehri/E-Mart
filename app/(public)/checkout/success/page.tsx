import Link from "next/link";
import { CheckCircle, ShoppingBag, FileText, Home } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const orderId = params.orderId;

  return (
    <>
      <section className="border-b border-muted-100 bg-white py-4">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-600">
            <Link href="/" className="flex items-center gap-1 text-muted-600 transition-colors hover:text-primary">
              <Home size={14} />
              Home
            </Link>
            <span className="text-muted-400">/</span>
            <span className="font-medium text-secondary-800">Order Confirmed</span>
          </nav>
        </div>
      </section>

      <section className="flex flex-col items-center justify-center px-4 py-16 lg:py-24">
        <div className="w-full max-w-lg text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle size={48} className="text-green-600" />
            </div>
          </div>

          <h1 className="mb-2 font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
            Thank You for Your Order!
          </h1>
          <p className="mb-2 text-muted-600">
            Your order has been placed successfully.
          </p>

          {orderId && (
            <div className="mb-8 inline-block rounded-xl border border-muted-200 bg-muted-50 px-6 py-3">
              <p className="text-xs text-muted-500">Order Number</p>
              <p className="font-mono text-lg font-bold text-secondary-800">{orderId}</p>
            </div>
          )}

          <div className="mb-8 rounded-2xl border border-muted-200 bg-white p-6 text-left shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-secondary-800">What happens next?</h2>
            <ul className="space-y-3 text-sm text-secondary-700">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <span className="text-xs font-bold">1</span>
                </div>
                <span>We&apos;ll send you an order confirmation email shortly.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <span className="text-xs font-bold">2</span>
                </div>
                <span>Our team will process your order within 24 hours.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <span className="text-xs font-bold">3</span>
                </div>
                <span>You&apos;ll receive tracking details once your order ships.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/products">
              <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-500">
                <ShoppingBag size={16} />
                Continue Shopping
              </span>
            </Link>
            {orderId && (
              <>
                <Link href="/dashboard/orders">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-muted-200 bg-white px-6 py-3 text-sm font-semibold text-secondary-800 transition-colors hover:bg-muted-50">
                    <FileText size={16} />
                    View My Orders
                  </span>
                </Link>
                <Link href={`/invoice/${orderId}`}>
                  <span className="inline-flex items-center gap-2 rounded-xl border border-muted-200 bg-white px-6 py-3 text-sm font-semibold text-secondary-800 transition-colors hover:bg-muted-50">
                    <FileText size={16} />
                    View Invoice
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
