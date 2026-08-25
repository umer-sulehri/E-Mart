import { type Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Review the E-Mart terms and conditions governing your use of our online grocery store, including orders, payments, shipping, returns, and account policies.',
  openGraph: {
    title: 'Terms & Conditions | E-Mart',
    description:
      'Review the E-Mart terms and conditions governing your use of our online grocery store, including orders, payments, shipping, returns, and account policies.',
  },
};

const sections = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'account', label: 'Account Registration' },
  { id: 'products', label: 'Products & Pricing' },
  { id: 'orders', label: 'Orders & Payment' },
  { id: 'shipping', label: 'Shipping & Delivery' },
  { id: 'returns', label: 'Returns & Refunds' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'contact-info', label: 'Contact Information' },
];

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-secondary-800 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Terms &amp; Conditions
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Terms &amp; Conditions</span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-4">
            {/* TOC Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl bg-muted-50 p-6">
                <h3 className="mb-4 font-heading text-sm font-bold text-secondary-800">
                  Table of Contents
                </h3>
                <nav>
                  <ul className="space-y-2">
                    {sections.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className="block text-sm text-secondary-600 transition-colors hover:text-primary"
                        >
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="lg:col-span-3 prose prose-sm max-w-none text-secondary-700">
              <p className="mb-4 text-xs text-secondary-500">Last updated: January 1, 2024</p>

              <p className="mb-6 leading-relaxed">
                Welcome to E-Mart. These Terms and Conditions (&quot;Terms&quot;) govern your use
                of our website and services. By accessing or using our platform, you agree to be
                bound by these Terms.
              </p>

              <div id="acceptance" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  1. Acceptance of Terms
                </h2>
                <p className="mb-4 leading-relaxed">
                  By creating an account, placing an order, or using any part of our website, you
                  confirm that you are at least 18 years old and agree to comply with and be bound
                  by these Terms. If you do not agree, please do not use our services.
                </p>
              </div>

              <div id="account" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  2. Account Registration
                </h2>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>You must provide accurate and complete information during registration.</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                  <li>You must notify us immediately of any unauthorized use of your account.</li>
                  <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
                </ul>
              </div>

              <div id="products" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  3. Products &amp; Pricing
                </h2>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>All product images are for illustration purposes; actual packaging may vary.</li>
                  <li>Prices are in Pakistani Rupees (₨) and are subject to change without notice.</li>
                  <li>We reserve the right to limit the quantity of items purchased per person or per order.</li>
                  <li>Product availability is subject to stock levels. We may cancel orders for unavailable items.</li>
                  <li>Promotional offers and discounts are valid for limited periods and may have additional terms.</li>
                </ul>
              </div>

              <div id="orders" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  4. Orders &amp; Payment
                </h2>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>An order is an offer to buy. We may accept or decline any order at our discretion.</li>
                  <li>Payment must be completed before order processing (except for COD orders).</li>
                  <li>Order confirmation will be sent via email and SMS once the order is accepted.</li>
                  <li>We accept Cash on Delivery, Easypaisa, JazzCash, and card payments via Stripe.</li>
                  <li>Incorrect pricing due to typographical errors may be corrected after order placement.</li>
                </ul>
              </div>

              <div id="shipping" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  5. Shipping &amp; Delivery
                </h2>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>Standard delivery is free for orders above ₨5,000. A ₨200 fee applies below this threshold.</li>
                  <li>Express (₨150) and Same Day (₨250) delivery options are available in select areas.</li>
                  <li>Estimated delivery times are not guaranteed and may be affected by external factors.</li>
                  <li>Risk of loss transfers to you upon delivery to your specified address.</li>
                  <li>Please inspect your order at delivery and report any issues within 24 hours.</li>
                </ul>
              </div>

              <div id="returns" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  6. Returns &amp; Refunds
                </h2>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>Most items can be returned within 7 days of delivery in their original condition.</li>
                  <li>Perishable items must be reported within 24 hours if damaged or defective.</li>
                  <li>Refunds are processed within 5-7 business days to the original payment method.</li>
                  <li>Delivery charges are non-refundable unless the error is on our part.</li>
                  <li>We reserve the right to refuse returns that do not meet our return criteria.</li>
                </ul>
              </div>

              <div id="privacy" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  7. Privacy
                </h2>
                <p className="mb-4 leading-relaxed">
                  Your use of our platform is also governed by our{' '}
                  <Link href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  , which describes how we collect, use, and protect your personal information. By
                  using our services, you consent to the practices described therein.
                </p>
              </div>

              <div id="liability" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  8. Limitation of Liability
                </h2>
                <p className="mb-4 leading-relaxed">
                  To the maximum extent permitted by law, E-Mart shall not be liable for any
                  indirect, incidental, special, or consequential damages arising from your use of
                  our services. Our total liability for any claim shall not exceed the amount paid
                  by you for the specific order in question.
                </p>
              </div>

              <div id="governing-law" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  9. Governing Law
                </h2>
                <p className="mb-4 leading-relaxed">
                  These Terms are governed by and construed in accordance with the laws of Pakistan.
                  Any disputes arising under these Terms shall be subject to the exclusive
                  jurisdiction of the courts in Lahore, Pakistan.
                </p>
              </div>

              <div id="contact-info" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  10. Contact Information
                </h2>
                <p className="mb-4 leading-relaxed">
                  For questions regarding these Terms, please contact us:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Email: info@emart.pk</li>
                  <li>Phone: +92 300 1234567</li>
                  <li>Address: 123 Organic Lane, Lahore, Pakistan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
