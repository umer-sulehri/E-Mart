'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';

const categories = [
  'All',
  'General',
  'Orders',
  'Shipping',
  'Payments',
  'Returns',
  'Account',
] as const;

type Category = (typeof categories)[number];

interface FaqItem {
  category: Exclude<Category, 'All'>;
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  // General
  {
    category: 'General',
    question: 'What is E-Mart?',
    answer:
      'E-Mart is an online grocery store serving customers across Pakistan. We offer a wide selection of fresh produce, dairy, meat, household essentials, and more — all delivered to your doorstep.',
  },
  {
    category: 'General',
    question: 'What areas do you deliver to?',
    answer:
      'We currently deliver to Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, and Multan. We are continuously expanding to more cities.',
  },
  {
    category: 'General',
    question: 'Are your products fresh and organic?',
    answer:
      'Yes! We partner directly with local farms and trusted suppliers. All perishable items undergo strict quality checks before dispatch.',
  },
  // Orders
  {
    category: 'Orders',
    question: 'How do I place an order?',
    answer:
      'Simply browse our shop, add items to your cart, and proceed to checkout. You can pay via COD, Easypaisa, JazzCash, or card.',
  },
  {
    category: 'Orders',
    question: 'Can I modify or cancel my order after placing it?',
    answer:
      'You can modify or cancel your order within 1 hour of placement. After that, the order enters processing and cannot be changed. Contact support for assistance.',
  },
  {
    category: 'Orders',
    question: 'Is there a minimum order value?',
    answer:
      'There is no minimum order value. However, orders below ₨5,000 are subject to a ₨200 delivery fee.',
  },
  {
    category: 'Orders',
    question: 'How do I use a coupon code?',
    answer:
      'Enter your coupon code at checkout in the "Apply Coupon" field and click "Apply." The discount will be reflected in your total.',
  },
  // Shipping
  {
    category: 'Shipping',
    question: 'What are your delivery options?',
    answer:
      'We offer Standard (3-5 days, free above ₨5,000), Express (1-2 days, ₨150), and Same Day (within 24 hours, ₨250) delivery options.',
  },
  {
    category: 'Shipping',
    question: 'How can I track my order?',
    answer:
      'Once your order is shipped, you will receive a tracking number via SMS and email. You can also track it from My Account > Orders.',
  },
  {
    category: 'Shipping',
    question: 'Do you deliver on weekends?',
    answer:
      'Yes, we deliver 7 days a week including weekends. Same-day delivery is available from Monday to Saturday, 9 AM to 5 PM.',
  },
  // Payments
  {
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer:
      'We accept Cash on Delivery (COD), Easypaisa, JazzCash, and all major credit/debit cards via Stripe.',
  },
  {
    category: 'Payments',
    question: 'Is online payment secure?',
    answer:
      'Absolutely. All card transactions are processed through Stripe, which uses industry-standard encryption and PCI-DSS compliance.',
  },
  {
    category: 'Payments',
    question: 'Can I pay partially with wallet and partially with cash?',
    answer:
      'Currently, we do not support split payments. You must choose one payment method per order.',
  },
  // Returns
  {
    category: 'Returns',
    question: 'What is your return policy?',
    answer:
      'You can return most items within 7 days of delivery if they are damaged, expired, or incorrect. Perishable items must be reported within 24 hours.',
  },
  {
    category: 'Returns',
    question: 'How do I request a refund?',
    answer:
      'Go to My Account > Orders, select the order, and click "Request Return." Our team will review and process your refund within 5-7 business days.',
  },
  {
    category: 'Returns',
    question: 'Are delivery charges refundable?',
    answer:
      'Delivery charges are non-refundable unless the return is due to an error on our part (wrong item, damaged product, etc.).',
  },
  // Account
  {
    category: 'Account',
    question: 'How do I create an account?',
    answer:
      'Click the "Sign Up" button on the top right corner, fill in your details, and you\'re ready to start shopping!',
  },
  {
    category: 'Account',
    question: 'I forgot my password. What should I do?',
    answer:
      'Click "Forgot Password" on the login page, enter your email address, and follow the instructions in the reset link we send you.',
  },
  {
    category: 'Account',
    question: 'How do I update my address?',
    answer:
      'Go to My Account > Addresses. You can add, edit, or remove saved addresses at any time.',
  },
];

export default function FaqPageClient() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === 'All' || faq.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-secondary-800 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Frequently Asked Questions
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">FAQ</span>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="bg-muted-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenIndex(null);
                }}
                placeholder="Search questions..."
                className="w-full rounded-full border border-muted-200 bg-white py-3 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories + FAQ List */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-3xl">
            {/* Category Tabs */}
            <div className="mb-8 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setOpenIndex(null);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-primary text-white'
                      : 'bg-muted-100 text-secondary-700 hover:bg-muted-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQ Accordion */}
            {filteredFaqs.length === 0 ? (
              <div className="py-12 text-center text-sm text-secondary-500">
                No questions found matching your search.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq, i) => (
                  <div
                    key={`${faq.category}-${i}`}
                    className="rounded-xl border border-muted-200 bg-white overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenIndex(openIndex === i ? null : i)}
                      className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-secondary-800 hover:bg-muted-50 transition-colors"
                    >
                      <span className="pr-4">{faq.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 flex-shrink-0 text-muted-400 transition-transform ${
                          openIndex === i ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openIndex === i && (
                      <div className="border-t border-muted-100 px-6 py-4 text-sm text-secondary-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section className="bg-muted-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="font-heading text-xl font-bold text-secondary-800">
            Still Have Questions?
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Can&apos;t find the answer you&apos;re looking for? Our support team is happy to help.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-500"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
