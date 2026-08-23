export const metadata = {
  title: 'Terms of Service | E-Mart',
  description: 'The terms governing your use of the E-Mart marketplace.',
};

export default function TermsPage() {
  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 legal-content">
          <h1>Terms of Service</h1>
          <p className="text-body-secondary">Last updated: August 2026</p>
          <hr />

          <h2 className="h4 mt-4">1. Acceptance of Terms</h2>
          <p className="text-body-secondary">
            By accessing or using E-Mart (&quot;the Platform&quot;), you agree to be bound by these
            Terms of Service and our Privacy Policy. If you do not agree, please do not use
            the Platform.
          </p>

          <h2 className="h4 mt-4">2. Accounts</h2>
          <p className="text-body-secondary">
            You must provide accurate registration information and keep your credentials
            secure. You are responsible for all activity under your account. Accounts may be
            suspended for fraudulent activity, abuse or violation of these terms.
          </p>

          <h2 className="h4 mt-4">3. Orders and Payments</h2>
          <p className="text-body-secondary">
            All prices are listed in Pakistani Rupees (PKR). Orders are subject to
            availability and confirmation of payment. We accept card payments via Stripe,
            bank transfer via PayFast, Easypaisa, and cash on delivery where available.
            Payment providers&apos; own terms also apply to their services.
          </p>

          <h2 className="h4 mt-4">4. Delivery</h2>
          <p className="text-body-secondary">
            Estimated delivery times are provided at checkout but are not guaranteed.
            Risk of loss passes to you upon delivery to the address provided.
          </p>

          <h2 className="h4 mt-4">5. Returns and Refunds</h2>
          <p className="text-body-secondary">
            Products may be returned within 7 days of delivery if unused and in original
            packaging. Refunds are processed to the original payment method after the
            returned item is received and inspected. Certain categories (perishables,
            personal care) may be excluded for hygiene reasons.
          </p>

          <h2 className="h4 mt-4">6. Seller Obligations</h2>
          <p className="text-body-secondary">
            Sellers must list products accurately, honour orders placed through the
            Platform, ship in a timely manner and comply with all applicable laws,
            including consumer protection regulations.
          </p>

          <h2 className="h4 mt-4">7. Prohibited Conduct</h2>
          <p className="text-body-secondary">
            You agree not to misuse the Platform, including: attempting unauthorized
            access, scraping content, submitting false reviews, reselling obtained
            accounts, or interfering with the Platform&apos;s operation.
          </p>

          <h2 className="h4 mt-4">8. Intellectual Property</h2>
          <p className="text-body-secondary">
            All content on the Platform — text, graphics, logos and software — is owned by
            E-Mart or its licensors and may not be reproduced without permission.
          </p>

          <h2 className="h4 mt-4">9. Limitation of Liability</h2>
          <p className="text-body-secondary">
            The Platform is provided &quot;as is&quot;. To the maximum extent permitted by law,
            E-Mart is not liable for indirect or consequential damages arising from your
            use of the Platform.
          </p>

          <h2 className="h4 mt-4">10. Changes to These Terms</h2>
          <p className="text-body-secondary">
            We may update these terms from time to time. Continued use of the Platform
            after changes are posted constitutes acceptance of the revised terms.
          </p>

          <h2 className="h4 mt-4">11. Contact</h2>
          <p className="text-body-secondary">
            Questions about these terms? Reach us through the contact page.
          </p>
        </div>
      </div>
    </div>
  );
}
