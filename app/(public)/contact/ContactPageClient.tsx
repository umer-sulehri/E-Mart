'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  ChevronDown,
  Send,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const contactInfo = [
  {
    icon: MapPin,
    title: 'Our Address',
    lines: ['123 Organic Lane, Garden Town', 'Lahore, Pakistan'],
  },
  {
    icon: Phone,
    title: 'Phone Number',
    lines: ['+92 300 1234567', '+92 42 35678901'],
  },
  {
    icon: Mail,
    title: 'Email Address',
    lines: ['info@emart.pk', 'support@emart.pk'],
  },
  {
    icon: Clock,
    title: 'Working Hours',
    lines: ['Mon - Sat: 9:00 AM - 9:00 PM', 'Sunday: 10:00 AM - 6:00 PM'],
  },
];

const faqs = [
  {
    question: 'How do I track my order?',
    answer:
      'You can track your order by logging into your account and navigating to the "My Orders" section. Each order will have a tracking number once it has been shipped.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'We offer a 7-day return policy for most items. If you receive a damaged or incorrect product, contact our support team within 7 days of delivery for a full refund or replacement.',
  },
  {
    question: 'Do you offer free delivery?',
    answer:
      'Yes! We offer free standard delivery on all orders above ₨5,000. For orders below this amount, a flat delivery fee of ₨200 applies.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept Cash on Delivery, Easypaisa, JazzCash, and all major credit/debit cards via Stripe.',
  },
  {
    question: 'How can I become a seller on E-Mart?',
    answer:
      'Visit our seller registration page or contact us at sellers@emart.pk. Our team will guide you through the onboarding process.',
  },
];

export default function ContactPageClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = 'Enter a valid email';
    if (!formData.subject.trim()) errs.subject = 'Subject is required';
    if (!formData.message.trim()) errs.message = 'Message is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to send message');
      }

      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-secondary-800 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Contact Us
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Contact Us</span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              <h2 className="mb-2 font-heading text-xl font-bold text-secondary-800">
                Send Us a Message
              </h2>
              <p className="mb-6 text-sm text-secondary-600">
                Have a question or feedback? Fill out the form below and we&apos;ll get back to you
                within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="John Doe"
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    error={errors.subject}
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-1.5 block text-sm font-medium text-secondary-800"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.message
                        ? 'border-danger focus:border-danger focus:ring-danger/20'
                        : 'border-muted-200'
                    }`}
                  />
                  {errors.message && (
                    <p className="mt-1.5 text-xs text-danger">{errors.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              {contactInfo.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex gap-4 rounded-2xl bg-muted-50 p-5"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-secondary-800">
                        {item.title}
                      </h3>
                      {item.lines.map((line) => (
                        <p key={line} className="mt-1 text-sm text-secondary-600">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Map Placeholder */}
              <div className="flex h-[300px] items-center justify-center rounded-2xl bg-muted-200 text-secondary-500">
                Map
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-2 text-center font-heading text-xl font-bold text-secondary-800">
              Frequently Asked Questions
            </h2>
            <p className="mb-8 text-center text-sm text-secondary-600">
              Quick answers to common questions
            </p>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-secondary-800 hover:bg-muted-50 transition-colors"
                  >
                    {faq.question}
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 text-muted-400 transition-transform ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="border-t border-muted-100 px-6 py-4 text-sm text-secondary-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
