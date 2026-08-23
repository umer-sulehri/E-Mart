import Link from 'next/link';

export const metadata = {
  title: 'About Us | E-Mart',
  description: 'Learn about E-Mart — Pakistan\'s online marketplace for groceries, electronics and everyday essentials.',
};

export default function AboutPage() {
  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-4">About E-Mart</h1>
          <p className="lead text-body-secondary">
            E-Mart is an online marketplace built to make everyday shopping in Pakistan
            simple, affordable and reliable.
          </p>
          <hr className="my-4" />
          <h2 className="h4 mt-4">Our Mission</h2>
          <p className="text-body-secondary">
            We connect customers with trusted sellers across the country — from fresh
            groceries and household essentials to electronics and lifestyle products —
            with transparent pricing, secure payments and dependable delivery.
          </p>
          <h2 className="h4 mt-4">What We Offer</h2>
          <ul className="text-body-secondary">
            <li>A curated catalogue from verified sellers</li>
            <li>Secure online payments (card, bank transfer, Easypaisa) and cash on delivery</li>
            <li>Order tracking from checkout to doorstep</li>
            <li>Responsive customer support six days a week</li>
          </ul>
          <h2 className="h4 mt-4">For Sellers</h2>
          <p className="text-body-secondary">
            E-Mart gives independent sellers a storefront, order management tools,
            earnings dashboards and payouts — everything needed to grow an online
            business without building their own infrastructure.
          </p>
          <div className="mt-5 d-flex gap-3">
            <Link href="/products" className="btn btn-primary">Start Shopping</Link>
            <Link href="/contact" className="btn btn-outline-secondary">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
