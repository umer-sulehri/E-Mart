import Link from 'next/link';

export const metadata = {
  title: 'FAQ | E-Mart',
  description: 'Frequently asked questions about ordering, payments, delivery and returns at E-Mart.',
};

const faqs = [
  {
    q: 'How do I place an order?',
    a: 'Browse the shop, add items to your cart, then proceed to checkout. You can pay by card, bank transfer, Easypaisa or cash on delivery.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'We accept credit/debit cards (via Stripe), bank transfers (via PayFast), Easypaisa and cash on delivery for eligible orders.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Most orders are delivered within 2–5 business days depending on your city and the seller\'s location. You can track every order from your account.',
  },
  {
    q: 'How can I track my order?',
    a: 'Open My Account → My Orders and select the order to see its current status and tracking details.',
  },
  {
    q: 'What is your return policy?',
    a: 'Products can be returned within 7 days of delivery if they are unused and in original packaging. Contact support with your order number to start a return.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'Orders can be cancelled from the order detail page while their status is still pending or confirmed. Once shipped, orders can no longer be cancelled online — please contact support.',
  },
  {
    q: 'Do I need an account to order?',
    a: 'Yes — an account lets us keep your order history, saved addresses and notifications in one secure place. Registration only takes an email address or phone number.',
  },
  {
    q: 'How do I become a seller?',
    a: 'Register a customer account, then contact our team to upgrade it to a seller account. You\'ll get access to the seller dashboard to add products and manage orders.',
  },
];

export default function FaqPage() {
  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-2">Frequently Asked Questions</h1>
          <p className="text-body-secondary mb-4">
            Quick answers about ordering, payments, delivery and returns.
          </p>
          <div className="accordion" id="faqAccordion">
            {faqs.map((item, i) => (
              <div className="accordion-item" key={i}>
                <h2 className="accordion-header">
                  <button
                    className={`accordion-button${i === 0 ? '' : ' collapsed'}`}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#faq-${i}`}
                    aria-expanded={i === 0}
                    aria-controls={`faq-${i}`}
                  >
                    {item.q}
                  </button>
                </h2>
                <div
                  id={`faq-${i}`}
                  className={`accordion-collapse collapse${i === 0 ? ' show' : ''}`}
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body text-body-secondary">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4">
            Didn&apos;t find your answer? <Link href="/contact">Contact our support team</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
