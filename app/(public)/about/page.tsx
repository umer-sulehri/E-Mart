import { type Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Target,
  Eye,
  Heart,
  Truck,
  Shield,
  Leaf,
  Headphones,
  ChevronRight,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about E-Mart — your trusted online organic grocery store in Pakistan. Discover our mission to deliver fresh, organic produce straight from local farms to your doorstep.',
  openGraph: {
    title: 'About Us | E-Mart',
    description:
      'Learn about E-Mart — your trusted online organic grocery store in Pakistan. Discover our mission to deliver fresh, organic produce straight from local farms to your doorstep.',
  },
};

const stats = [
  { value: '6+', label: 'Years of Service' },
  { value: '10K+', label: 'Happy Customers' },
  { value: '500+', label: 'Products Available' },
  { value: '50+', label: 'Trusted Sellers' },
  { value: '20+', label: 'Delivery Cities' },
  { value: '99%', label: 'Satisfaction Rate' },
];

const values = [
  {
    icon: Target,
    title: 'Our Mission',
    description:
      'To make fresh, organic, and high-quality groceries accessible to every household in Pakistan at affordable prices, delivered right to your doorstep.',
  },
  {
    icon: Eye,
    title: 'Our Vision',
    description:
      'To become Pakistan\'s most trusted online grocery platform, known for freshness, reliability, and exceptional customer experience.',
  },
  {
    icon: Heart,
    title: 'Our Values',
    description:
      'We believe in honesty, quality, sustainability, and putting our customers first. Every product we deliver is a promise of freshness and care.',
  },
];

const team = [
  { name: 'Ahmad Khan', role: 'Founder & CEO', initials: 'AK' },
  { name: 'Sara Malik', role: 'Head of Operations', initials: 'SM' },
  { name: 'Ali Raza', role: 'Tech Lead', initials: 'AR' },
  { name: 'Fatima Noor', role: 'Marketing Director', initials: 'FN' },
];

const whyChooseUs = [
  {
    icon: Leaf,
    title: '100% Fresh Products',
    description: 'We source directly from local farms and trusted suppliers to ensure maximum freshness.',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Same-day and next-day delivery options to get your groceries when you need them.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Multiple secure payment options including COD, Easypaisa, JazzCash, and card payments.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Our customer service team is always ready to help with any questions or concerns.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-secondary-800 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
            About Us
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">About Us</span>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted-100">
              <Image
                src="/images/about.jpg"
                alt="E-Mart team"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
                Our Story
              </h2>
              <div className="mt-2 mb-6 h-1 w-16 rounded bg-primary" />
              <p className="mb-4 leading-relaxed text-secondary-700">
                Founded in 2019, E-Mart started with a simple idea: everyone deserves access to fresh,
                high-quality groceries without leaving the comfort of their home. What began as a small
                delivery service in Lahore has grown into one of Pakistan&apos;s most trusted online
                grocery platforms.
              </p>
              <p className="mb-4 leading-relaxed text-secondary-700">
                We work directly with local farmers, dairies, and producers to bring you the freshest
                fruits, vegetables, meat, and everyday essentials. Our commitment to quality means
                every product passes through strict quality checks before it reaches your doorstep.
              </p>
              <p className="leading-relaxed text-secondary-700">
                Today, we serve thousands of happy customers across multiple cities, and we&apos;re
                just getting started. Our goal is to make grocery shopping effortless, affordable,
                and enjoyable for every Pakistani household.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="bg-muted-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
              What Drives Us
            </h2>
            <div className="mx-auto mt-2 mb-4 h-1 w-16 rounded bg-primary" />
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {values.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-3 font-heading text-lg font-bold text-secondary-800">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-secondary-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
              Meet Our Team
            </h2>
            <div className="mx-auto mt-2 mb-4 h-1 w-16 rounded bg-primary" />
            <p className="mx-auto max-w-xl text-secondary-600">
              The passionate people behind E-Mart who work tirelessly to bring you the best grocery
              shopping experience.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div
                key={member.name}
                className="group rounded-2xl bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                  {member.initials}
                </div>
                <h3 className="font-heading text-lg font-bold text-secondary-800">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm text-primary">{member.role}</p>
                <div className="mt-4 flex justify-center gap-3">
                  {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-muted-200 text-muted-500 transition-colors hover:border-primary hover:bg-primary hover:text-white"
                      aria-label="Social link"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="bg-secondary-800 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
              Why Choose Us
            </h2>
            <div className="mx-auto mt-2 mb-4 h-1 w-16 rounded bg-primary" />
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {whyChooseUs.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-bold text-secondary-800">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-secondary-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
            Join Our Growing Community
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Experience the convenience of online grocery shopping with E-Mart. Fresh products, great
            prices, and doorstep delivery.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-secondary-800 transition-colors hover:bg-muted-100"
            >
              Start Shopping
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-secondary-800"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
