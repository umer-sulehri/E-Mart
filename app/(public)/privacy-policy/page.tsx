export const metadata = {
  title: 'Privacy Policy | E-Mart',
  description: 'How E-Mart collects, uses and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 legal-content">
          <h1>Privacy Policy</h1>
          <p className="text-body-secondary">Last updated: August 2026</p>
          <hr />

          <h2 className="h4 mt-4">1. Information We Collect</h2>
          <p className="text-body-secondary">
            We collect the information you provide when registering (name, email, phone),
            placing orders (shipping addresses, order contents), contacting support, and
            subscribing to newsletters. Payment card details are handled directly by our
            payment providers (Stripe, PayFast, Easypaisa) and never stored on our servers.
          </p>

          <h2 className="h4 mt-4">2. How We Use Your Information</h2>
          <ul className="text-body-secondary">
            <li>Processing orders, payments and deliveries</li>
            <li>Sending transactional notifications about your orders</li>
            <li>Providing customer support</li>
            <li>Improving our catalogue, search and user experience</li>
            <li>Sending marketing communications only where you have opted in</li>
          </ul>

          <h2 className="h4 mt-4">3. How We Protect Your Data</h2>
          <p className="text-body-secondary">
            Data is stored with Supabase under Row Level Security policies. Sessions use
            secure, http-only cookies. Passwords are hashed and are never visible to us.
            One-time passcodes expire automatically and are rate-limited.
          </p>

          <h2 className="h4 mt-4">4. Sharing of Information</h2>
          <p className="text-body-secondary">
            We share data only as necessary to operate the service: with sellers for
            fulfilment of your orders (name, address, contact details), with payment
            processors for payment handling, and with communication providers (email/SMS)
            for notifications. We do not sell your personal information.
          </p>

          <h2 className="h4 mt-4">5. Cookies</h2>
          <p className="text-body-secondary">
            We use essential cookies to keep you signed in and remember your preferences,
            plus analytics cookies to understand site usage. You can control cookies in
            your browser settings; some features may not work without essential cookies.
          </p>

          <h2 className="h4 mt-4">6. Your Rights</h2>
          <p className="text-body-secondary">
            You may access, correct or delete your personal information from your profile
            settings or by contacting support. You can opt out of promotional emails at any
            time using the unsubscribe link or your notification preferences.
          </p>

          <h2 className="h4 mt-4">7. Data Retention</h2>
          <p className="text-body-secondary">
            Order records are retained for accounting and legal compliance. Newsletter
            subscriptions are kept until you unsubscribe. One-time passcodes and pending
            registrations expire automatically within minutes to hours.
          </p>

          <h2 className="h4 mt-4">8. Children&apos;s Privacy</h2>
          <p className="text-body-secondary">
            The Platform is not directed at children under 13, and we do not knowingly
            collect their personal information.
          </p>

          <h2 className="h4 mt-4">9. Changes to This Policy</h2>
          <p className="text-body-secondary">
            We may update this policy periodically. Material changes will be announced on
            the Platform.
          </p>

          <h2 className="h4 mt-4">10. Contact</h2>
          <p className="text-body-secondary">
            For privacy questions or requests, reach us through the contact page.
          </p>
        </div>
      </div>
    </div>
  );
}
