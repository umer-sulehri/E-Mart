import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const tocSections = [
  { id: 'info-we-collect', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Your Information' },
  { id: 'sharing', label: 'Sharing Your Information' },
  { id: 'data-security', label: 'Data Security' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'contact-us', label: 'Contact Us' },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-secondary-800 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Privacy Policy
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Privacy Policy</span>
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
                    {tocSections.map((s) => (
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
                E-Mart (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting
                your privacy. This Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you visit our website and use our services.
              </p>

              <div id="info-we-collect" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  1. Information We Collect
                </h2>
                <p className="mb-3 leading-relaxed">
                  We may collect information about you in various ways, including:
                </p>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>
                    <strong>Personal Data:</strong> Name, email address, phone number, shipping
                    address, and billing information provided during account registration or
                    checkout.
                  </li>
                  <li>
                    <strong>Transaction Data:</strong> Details of products you purchase, order
                    history, payment method, and delivery information.
                  </li>
                  <li>
                    <strong>Usage Data:</strong> Information about how you interact with our
                    platform, including browsing history, search queries, and pages visited.
                  </li>
                  <li>
                    <strong>Device Data:</strong> IP address, browser type, operating system, and
                    device identifiers.
                  </li>
                </ul>
              </div>

              <div id="how-we-use" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  2. How We Use Your Information
                </h2>
                <p className="mb-3 leading-relaxed">
                  We use the information we collect to:
                </p>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>Process and fulfill your orders, including delivery and payment processing.</li>
                  <li>Create and manage your account.</li>
                  <li>Communicate with you about orders, promotions, and updates.</li>
                  <li>Improve our website, products, and services.</li>
                  <li>Personalize your shopping experience and provide relevant recommendations.</li>
                  <li>Detect and prevent fraud or unauthorized access.</li>
                  <li>Comply with legal obligations.</li>
                </ul>
              </div>

              <div id="sharing" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  3. Sharing Your Information
                </h2>
                <p className="mb-3 leading-relaxed">
                  We do not sell your personal information. We may share your data with:
                </p>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>
                    <strong>Delivery Partners:</strong> To fulfill your orders and deliver products
                    to your address.
                  </li>
                  <li>
                    <strong>Payment Processors:</strong> To securely process your payments (e.g.,
                    Stripe).
                  </li>
                  <li>
                    <strong>Service Providers:</strong> Third-party vendors who assist with hosting,
                    analytics, marketing, and customer support.
                  </li>
                  <li>
                    <strong>Legal Authorities:</strong> When required by law or to protect our
                    rights.
                  </li>
                </ul>
              </div>

              <div id="data-security" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  4. Data Security
                </h2>
                <p className="mb-4 leading-relaxed">
                  We implement industry-standard security measures to protect your personal
                  information, including SSL encryption, secure servers, and access controls.
                  However, no method of transmission over the Internet is 100% secure, and we
                  cannot guarantee absolute security.
                </p>
              </div>

              <div id="cookies" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  5. Cookies
                </h2>
                <p className="mb-3 leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your experience.
                  Cookies are small data files stored on your device that help us remember your
                  preferences and understand how you use our platform.
                </p>
                <p className="mb-4 leading-relaxed">
                  You can choose to disable cookies through your browser settings, though some
                  features of our site may not function properly as a result.
                </p>
              </div>

              <div id="your-rights" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  6. Your Rights
                </h2>
                <p className="mb-3 leading-relaxed">You have the right to:</p>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>Access the personal information we hold about you.</li>
                  <li>Request correction of inaccurate or incomplete data.</li>
                  <li>Request deletion of your personal data.</li>
                  <li>Opt out of marketing communications at any time.</li>
                  <li>Withdraw consent for data processing where applicable.</li>
                </ul>
                <p className="mb-4 leading-relaxed">
                  To exercise any of these rights, please contact us using the information below.
                </p>
              </div>

              <div id="contact-us" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  7. Contact Us
                </h2>
                <p className="mb-4 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us:
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
