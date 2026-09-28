import { type Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Learn how E-Mart uses cookies and similar technologies, what each type does, and how you can control or withdraw your consent at any time.',
  openGraph: {
    title: 'Cookie Policy | E-Mart',
    description:
      'Learn how E-Mart uses cookies and similar technologies, what each type does, and how you can control or withdraw your consent at any time.',
  },
};

const tocSections = [
  { id: 'what-are-cookies', label: 'What Are Cookies?' },
  { id: 'categories', label: 'Cookies We Use' },
  { id: 'cookie-reference', label: 'Cookie Reference' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'local-storage', label: 'Local Storage' },
  { id: 'third-party', label: 'Third-Party Cookies' },
  { id: 'retention', label: 'Retention & Re-prompting' },
  { id: 'your-choices', label: 'Your Choices' },
  { id: 'contact-us', label: 'Contact Us' },
];

export default function CookiePolicyPage() {
  return (
    <>
      <section className="relative bg-secondary-800 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Cookie Policy
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Cookie Policy</span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-4">
            <aside className="lg:col-span-1">
              <div className="sticky top-[var(--header-h)] lg:top-24 rounded-2xl bg-muted-50 p-6">
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

            <div className="lg:col-span-3 prose prose-sm max-w-none text-secondary-700">
              <p className="mb-4 text-xs text-secondary-500">Last updated: September 23, 2026</p>

              <p className="mb-6 leading-relaxed">
                This Cookie Policy explains what cookies and similar technologies E-Mart uses,
                why we use them, and how you can control your preferences. It works together
                with our{' '}
                <Link href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>

              <div id="what-are-cookies" className="scroll-mt-[var(--header-h)] lg:scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  1. What Are Cookies?
                </h2>
                <p className="mb-4 leading-relaxed">
                  Cookies are small text files stored on your device when you visit a website.
                  They help the site remember your session, preferences, and how you use the
                  platform. This policy also covers web storage technologies such as
                  localStorage, which work similarly but are managed by the browser.
                </p>
              </div>

              <div id="categories" className="scroll-mt-[var(--header-h)] lg:scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  2. Cookies We Use
                </h2>
                <p className="mb-3 leading-relaxed">
                  We group cookies and similar technologies into the categories below. When you
                  first visit, we ask for your consent and always keep essential cookies active.
                </p>

                <div className="mb-4 space-y-4">
                  <div className="rounded-xl border border-muted-100 p-4">
                    <h3 className="font-semibold text-secondary-800">Essential</h3>
                    <p className="mt-1 text-sm leading-relaxed">
                      Required for the store to function. These include your sign-in session
                      (Supabase authentication), security measures, and keeping your cart
                      between visits. They are always active and cannot be turned off.
                    </p>
                  </div>

                  <div className="rounded-xl border border-muted-100 p-4">
                    <h3 className="font-semibold text-secondary-800">Analytics</h3>
                    <p className="mt-1 text-sm leading-relaxed">
                      Used with your permission to understand how visitors use the platform. We
                      currently use Google Analytics 4 with IP anonymization to see which
                      products and pages are popular, so we can improve the shopping
                      experience.
                    </p>
                  </div>

                  <div className="rounded-xl border border-muted-100 p-4">
                    <h3 className="font-semibold text-secondary-800">Preferences / Consent</h3>
                    <p className="mt-1 text-sm leading-relaxed">
                      Remember choices that personalize your visit, such as items in your
                      compare list, saved review drafts, and which cookie choices you made.
                      Your consent choice is kept for <strong>13 months</strong>{' '}
                      from the day you decide, after which you will be asked again.
                    </p>
                  </div>
                </div>
              </div>

              <div id="cookie-reference" className="scroll-mt-[var(--header-h)] lg:scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  3. Cookie Reference
                </h2>
                <p className="mb-4 leading-relaxed">
                  The table lists every cookie and local-storage key E-Mart sets on your
                  device, together with the security flags we apply to each one. “Session”
                  storage and cookies expire when you close the browser.
                </p>
                <div className="mb-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-muted-200 text-left">
                        <th className="py-2 pr-4 font-semibold text-secondary-800">Name</th>
                        <th className="py-2 pr-4 font-semibold text-secondary-800">Type</th>
                        <th className="py-2 pr-4 font-semibold text-secondary-800">Purpose</th>
                        <th className="py-2 pr-4 font-semibold text-secondary-800">Expiry</th>
                        <th className="py-2 font-semibold text-secondary-800">Security flags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted-100">
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">sb-*-auth-token</td>
                        <td className="py-2 pr-4">Essential</td>
                        <td className="py-2 pr-4">Sign-in session (Supabase authentication)</td>
                        <td className="py-2 pr-4">Up to 400 days; the session token is rotated every time it is refreshed</td>
                        <td className="py-2 text-xs text-secondary-600">Secure · SameSite=Lax</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">sb-user-role</td>
                        <td className="py-2 pr-4">Essential</td>
                        <td className="py-2 pr-4">Cached role for route protection / menus</td>
                        <td className="py-2 pr-4">1 hour, refreshed on each visit while signed in</td>
                        <td className="py-2 text-xs text-secondary-600">Secure · HttpOnly · SameSite=Lax</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">emart_impersonating</td>
                        <td className="py-2 pr-4">Essential / Security</td>
                        <td className="py-2 pr-4">Shows the “you are viewing as” banner while an admin is impersonating another account. Stores the display name only, never an email address</td>
                        <td className="py-2 pr-4">1 hour</td>
                        <td className="py-2 text-xs text-secondary-600">Secure · SameSite=Lax · sent only to the impersonation endpoint</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">emart_admin_restore</td>
                        <td className="py-2 pr-4">Essential / Security</td>
                        <td className="py-2 pr-4">Temporary admin impersonation guard</td>
                        <td className="py-2 pr-4">1 hour</td>
                        <td className="py-2 text-xs text-secondary-600">Secure · HttpOnly · SameSite=Lax · sent only to the impersonation endpoint</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">emart-cart</td>
                        <td className="py-2 pr-4">Preference</td>
                        <td className="py-2 pr-4">Cart contents and any applied coupon</td>
                        <td className="py-2 pr-4">Local storage, emptied when you check out</td>
                        <td className="py-2 text-xs text-secondary-600">Local storage (no card data is ever stored)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">emart-auth</td>
                        <td className="py-2 pr-4">Essential</td>
                        <td className="py-2 pr-4">Cached display name, email, role and avatar so the header and menus render before the page loads. Your phone number and date of birth are not stored here — they are loaded on demand from your profile</td>
                        <td className="py-2 pr-4">Local storage, deleted when you sign out</td>
                        <td className="py-2 text-xs text-secondary-600">Local storage · cleared on sign-out</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">emart-compare</td>
                        <td className="py-2 pr-4">Preference</td>
                        <td className="py-2 pr-4">Products in your compare list, for the duration of the browsing session only</td>
                        <td className="py-2 pr-4">Session storage (cleared when the tab session ends)</td>
                        <td className="py-2 text-xs text-secondary-600">Session storage</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">emart-review-draft-*</td>
                        <td className="py-2 pr-4">Preference</td>
                        <td className="py-2 pr-4">Autosaved review drafts, one per product</td>
                        <td className="py-2 pr-4">Local storage, discarded after 7 days, on submit, or on sign-out</td>
                        <td className="py-2 text-xs text-secondary-600">Local storage · 7-day expiry</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">emart-consent</td>
                        <td className="py-2 pr-4">Consent</td>
                        <td className="py-2 pr-4">Your cookie choices</td>
                        <td className="py-2 pr-4">13 months (390 days)</td>
                        <td className="py-2 text-xs text-secondary-600">Local storage</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">emart-consent-anon-id</td>
                        <td className="py-2 pr-4">Consent</td>
                        <td className="py-2 pr-4">Random identifier linking your consent to an audit record (no identity)</td>
                        <td className="py-2 pr-4">Local storage, until you clear it</td>
                        <td className="py-2 text-xs text-secondary-600">Local storage · random ID</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">_ga / _gid / _gat</td>
                        <td className="py-2 pr-4">Analytics*</td>
                        <td className="py-2 pr-4">Google Analytics 4 usage measurement</td>
                        <td className="py-2 pr-4">2 years / 24h / 1min (removed when you withdraw)</td>
                        <td className="py-2 text-xs text-secondary-600">Set by Google · deleted on withdrawal</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mb-4 text-xs text-secondary-500">
                  * Analytics cookies are only set after you accept analytics cookies and are
                  deleted the moment you turn analytics off.
                </p>
                <h3 className="mb-3 font-heading text-base font-bold text-secondary-800">
                  How we protect these
                </h3>
                <ul className="mb-4 list-disc space-y-2 pl-5 text-sm leading-relaxed">
                  <li>
                    Every cookie we set is marked <strong>Secure</strong>, so it is never
                    transmitted over an unencrypted connection, and{' '}
                    <strong>SameSite=Lax</strong>, so other websites cannot send it with
                    their own requests to E-Mart.
                  </li>
                  <li>
                    Our sign-in and role cookies are marked <strong>HttpOnly</strong>,
                    so no script on the page can read them. The temporary
                    impersonation cookie is readable by our own admin interface so it
                    can show which account is being viewed, but it is never sent
                    anywhere except the impersonation endpoint and it never stores
                    your email address.
                  </li>
                  <li>
                    The two impersonation cookies are restricted to the single URL path that
                    needs them, so they are not attached to the rest of your browsing.
                  </li>
                  <li>
                    Signing out deletes the cached profile and any saved review drafts from
                    your browser. Your cart and compare list are not personal records, so they
                    are kept.
                  </li>
                  <li>
                    We never store payment card details in cookies or local storage — orders
                    are paid by cash on delivery or e-wallet.
                  </li>
                </ul>
              </div>

              <div id="analytics" className="scroll-mt-[var(--header-h)] lg:scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  4. Analytics
                </h2>
                <p className="mb-4 leading-relaxed">
                  Google Analytics collects anonymized usage information such as pages viewed,
                  products opened, and search activity. IP addresses are anonymized and we do
                  not use it to identify individual visitors. Analytics begins only after you
                  accept analytics cookies, and you can turn it off at any time from the Cookie
                  Settings link in the footer.
                </p>
              </div>

              <div id="local-storage" className="scroll-mt-[var(--header-h)] lg:scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  5. Local Storage
                </h2>
                <p className="mb-3 leading-relaxed">
                  We use your browser&apos;s local storage (a technology similar to cookies) to
                  remember:
                </p>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>
                    A cached copy of your display name, email, role and avatar so the
                    header and menus appear instantly (<code>emart-auth</code>). Your
                    phone number and date of birth are never written here, and the whole
                    entry is deleted when you sign out.
                  </li>
                  <li>Your cart contents and any applied coupon (<code>emart-cart</code>)</li>
                  <li>Your compare list (<code>emart-compare</code>), kept in session storage for the current tab session only</li>
                  <li>Autosaved drafts of product reviews (<code>emart-review-draft-*</code>), discarded after 7 days, on submit, or on sign-out</li>
                  <li>Your cookie consent choice (<code>emart-consent</code>) and an anonymous consent identifier (<code>emart-consent-anon-id</code>)</li>
                </ul>
                <p className="mb-4 leading-relaxed">
                  Local storage stays on your device until you clear it, so signing out on a
                  shared or public computer is the safest way to remove your cached details.
                  You can also clear local storage at any time through your browser&apos;s
                  settings, which will also reset your cookie choice.
                </p>
              </div>

              <div id="third-party" className="scroll-mt-[var(--header-h)] lg:scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  6. Third-Party Cookies
                </h2>
                <p className="mb-4 leading-relaxed">
                  We do not currently use advertising, retargeting, or social-media cookies.
                  The only third-party processing occurs through Google Analytics when you have
                  accepted analytics cookies.
                </p>
                <p className="mb-4 leading-relaxed">
                  <strong>Do Not Sell:</strong> E-Mart never sells your personal information.
                  If you are in the United States, the California Consumer Privacy Act (CCPA)
                  gives you the right to opt out of any future “sale” or “sharing”: nothing is
                  sold and you can manage your choices at any time.
                </p>
              </div>

              <div id="retention" className="scroll-mt-[var(--header-h)] lg:scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  7. Retention & Re-prompting
                </h2>
                <p className="mb-4 leading-relaxed">
                  Your consent choice is stored for <strong>13 months</strong>. After that we
                  ask again. We may also re-prompt you if this policy or the consent banner
                  materially changes, so you can decide based on the latest information.
                  When you change your mind, your preference is updated immediately and a
                  record of the change is kept for compliance and auditing.
                </p>
              </div>

              <div id="your-choices" className="scroll-mt-[var(--header-h)] lg:scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  8. Your Choices
                </h2>
                <ul className="mb-4 list-disc space-y-2 pl-5">
                  <li>
                    <strong>At any time:</strong> Use the “Cookie Settings” link in the footer
                    to accept, reject, or customize analytics cookies.
                  </li>
                  <li>
                    <strong>Via your browser:</strong> Most browsers let you view, block, or
                    delete cookies and site data from their settings.
                  </li>
                  <li>
                    <strong>Consent withdrawal:</strong> Turning analytics off stops new data
                    collection immediately, deletes the Google Analytics cookies already set,
                    and records the withdrawal. Data already collected may have been used for
                    aggregate reports.
                  </li>
                  <li>
                    <strong>Personal information rights:</strong> You can download the data we
                    hold about you or ask us to erase it from your account’s Privacy &amp; Data
                    settings. If you are in the US, you also have the right to opt out of any
                    sale or sharing under the CCPA — nothing is ever sold.
                  </li>
                </ul>
              </div>

              <div id="contact-us" className="scroll-mt-[var(--header-h)] lg:scroll-mt-24">
                <h2 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                  9. Contact Us
                </h2>
                <p className="mb-4 leading-relaxed">
                  Questions about cookies or this policy? Contact us at email@emart.pk or view
                  our{' '}
                  <Link href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}