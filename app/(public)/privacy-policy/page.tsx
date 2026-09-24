import { type Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read the E-Mart privacy policy to understand how we collect, use, and protect your personal information when you shop on our organic grocery platform.',
  openGraph: {
    title: 'Privacy Policy | E-Mart',
    description:
      'Read the E-Mart privacy policy to understand how we collect, use, and protect your personal information when you shop on our organic grocery platform.',
  },
};

const tocSections = [
  { id: 'info-we-collect', label: 'Information We Collect' },
  { id: 'legal-basis', label: 'Data Controller & Legal Basis' },
  { id: 'how-we-use', label: 'How We Use Your Information' },
  { id: 'sharing', label: 'Sharing Your Information' },
  { id: 'data-retention', label: 'Data Retention' },
  { id: 'data-security', label: 'Data Security' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'jurisdiction', label: 'GDPR & CCPA' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'changes', label: 'Changes to This Policy' },
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
              <p className="mb-4 text-xs text-secondary-500">Last updated: September 25, 2026</p>

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

              <div id="legal-basis" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  2. Data Controller & Legal Basis
                </h2>
                <p className="mb-3 leading-relaxed">
                  E-Mart (operating as an organic grocery e-commerce platform) is the data
                  controller for the personal information described in this policy. For
                  practical questions, contact our privacy team at{' '}
                  <a href="mailto:privacy@emart.pk" className="text-primary hover:underline">
                    privacy@emart.pk
                  </a>
                  .
                </p>
                <p className="mb-3 leading-relaxed">We process personal data on the following legal bases:</p>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>
                    <strong>Contract performance:</strong> creating your account, processing
                    orders, payments, and deliveries.
                  </li>
                  <li>
                    <strong>Legitimate interest:</strong> operating and improving the platform,
                    fraud prevention, security, and customer support.
                  </li>
                  <li>
                    <strong>Consent:</strong> analytics cookies, marketing, and optional
                    profiling — you can withdraw consent at any time.
                  </li>
                  <li>
                    <strong>Legal obligation:</strong> tax, accounting, and law-enforcement
                    requirements.
                  </li>
                </ul>
              </div>

              <div id="how-we-use" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  3. How We Use Your Information
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
                  4. Sharing Your Information
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

              <div id="data-retention" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  5. Data Retention
                </h2>
                <p className="mb-3 leading-relaxed">
                  We keep personal data only as long as necessary for the purposes described in
                  this policy. Our retention schedule:
                </p>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>
                    <strong>Account and profile data:</strong> until you ask us to delete it or
                    close your account.
                  </li>
                  <li>
                    <strong>Order records and invoices:</strong> retained as required for tax
                    and accounting (typically 5–7 years, then deleted or anonymized).
                  </li>
                  <li>
                    <strong>Consent preferences:</strong> 13 months from your last choice, then
                    you are asked again.
                  </li>
                  <li>
                    <strong>Search history:</strong> 50 most recent searches per account, or
                    until you request erasure.
                  </li>
                </ul>
              </div>

              <div id="data-security" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  6. Data Security
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
                  7. Cookies
                </h2>
                <p className="mb-3 leading-relaxed">
                  We use cookies and similar technologies to run the store and, with your
                  consent, to understand how visitors use the platform. Essential cookies keep
                  you signed in and protect your account; analytics cookies (currently Google
                  Analytics with anonymized IPs) help us improve the shopping experience.
                </p>
                <p className="mb-3 leading-relaxed">
                  When you first visit we ask for your permission through our cookie banner.
                  You can accept, reject, or customize analytics cookies, and change your
                  choice at any time from the “Cookie Settings” link in the footer or by
                  clearing cookies in your browser.
                </p>
                <p className="mb-4 leading-relaxed">
                  See our{' '}
                  <Link href="/cookie-policy" className="text-primary hover:underline">
                    Cookie Policy
                  </Link>{' '}
                  for a full breakdown of the cookies and local storage we use.
                </p>
              </div>

              <div id="your-rights" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  8. Your Rights
                </h2>
                <p className="mb-3 leading-relaxed">You have the right to:</p>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>
                    <strong>Access / portability:</strong> download a machine-readable copy of
                    the personal data we hold about you from your account’s Privacy &amp; Data
                    settings, or by contacting us.
                  </li>
                  <li>
                    <strong>Rectification:</strong> correct inaccurate or incomplete data from
                    your profile or by request.
                  </li>
                  <li>
                    <strong>Erasure:</strong> delete your personal data. Use the “Delete my
                    personal data” option under Privacy &amp; Data, or close your account.
                    We retain records required for tax, accounting, and legal compliance, but
                    de-identify or anonymize them.
                  </li>
                  <li>
                    <strong>Opt out of marketing:</strong> unsubscribe from the newsletter with
                    the link in any email or via your account settings.
                  </li>
                  <li>
                    <strong>Withdraw consent:</strong> change analytics preferences at any time
                    via the “Cookie Settings” link in the footer; withdrawal applies
                    immediately.
                  </li>
                  <li>
                    <strong>Lodge a complaint:</strong> contact your local data protection
                    authority if you believe we have not acted in accordance with this policy.
                  </li>
                </ul>
                <p className="mb-4 leading-relaxed">
                  To exercise any of these rights, use the settings above or contact us and we
                  will respond within 30 days.
                </p>
              </div>

              <div id="jurisdiction" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  9. Jurisdiction-Specific Notices
                </h2>

                <h3 className="mb-2 font-semibold text-secondary-800">European Union / EEA (GDPR)</h3>
                <p className="mb-3 leading-relaxed">
                  For visitors in the European Economic Area, the United Kingdom, and
                  Switzerland, E-Mart processes personal data in accordance with the GDPR. Your
                  consent for cookies and marketing is freely given and can be withdrawn at any
                  time. You may request access, rectification, erasure, restriction, portability,
                  or object to processing by using the tools described above. When your data is
                  transferred outside the EEA, we rely on approved safeguards such as Standard
                  Contractual Clauses.
                </p>

                <h3 className="mb-2 font-semibold text-secondary-800">United States (CCPA / CPRA)</h3>
                <p className="mb-3 leading-relaxed">
                  For visitors in California and elsewhere in the United States, the California
                  Consumer Privacy Act (CCPA) grants you the right to know what personal
                  information is collected, to delete it, to correct it, and to opt out of the
                  “sale” or “sharing” of personal information.
                </p>
                <p className="mb-3 leading-relaxed">
                  E-Mart does not sell your personal information and has not sold any in the
                  preceding 12 months. You can exercise your rights through the account’s
                  Privacy &amp; Data settings, and we will not discriminate against you for doing
                  so.
                </p>
                <p id="do-not-sell" className="rounded-xl border border-muted-100 bg-muted-50 p-4 leading-relaxed">
                  <strong>Do Not Sell My Personal Information:</strong> we do not sell or share
                  personal information for cross-context behavioral advertising. You can manage
                  your cookie and analytics preferences at any time from the “Cookie Settings”
                  link in the footer, and use the data download or deletion tools in your
                  account to exercise your privacy rights.
                </p>
              </div>

              <div id="children" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  10. Children&apos;s Privacy
                </h2>
                <p className="mb-4 leading-relaxed">
                  Our platform is not directed to children under 16. We do not knowingly collect
                  personal data from children. If you believe a child has provided us personal
                  data, please contact us and we will delete it.
                </p>
              </div>

              <div id="changes" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  11. Changes to This Policy
                </h2>
                <p className="mb-4 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of
                  material changes by updating the “Last updated” date above and, where required,
                  re-asking for consent. Continued use of the platform after changes take effect
                  constitutes acceptance of the revised policy.
                </p>
              </div>

              <div id="contact-us" className="scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  12. Contact Us
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
