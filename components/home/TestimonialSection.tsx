'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import SectionHeader from '@/components/ui/SectionHeader';
import StarRating from '@/components/ui/StarRating';

interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  review: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    avatar: '/images/reviewer-1.jpg',
    review:
      "I've been shopping at E-Mart for over a year now. The quality of organic produce is consistently excellent, and the delivery is always on time. Highly recommended for anyone looking for fresh, healthy groceries!",
    rating: 5,
  },
  {
    id: 2,
    name: 'Michael Chen',
    avatar: '/images/reviewer-2.jpg',
    review:
      "The app makes grocery shopping so convenient. I love the wide selection of organic products and the great prices. Customer support is also very responsive. It's my go-to for weekly shopping.",
    rating: 4.5,
  },
  {
    id: 3,
    name: 'Emma Wilson',
    avatar: '/images/reviewer-3.jpg',
    review:
      'Switching to E-Mart was the best decision for our family. The kids love the fresh fruits and I appreciate knowing everything is sourced responsibly. The subscription plan saves us money too!',
    rating: 5,
  },
];

const TestimonialSection = React.forwardRef<
  HTMLDivElement,
  { className?: string }
>(({ className }, ref) => {
  return (
    <section ref={ref} className={cn('py-4', className)}>
      <div className="container mx-auto">
        <SectionHeader title="What Our Customers Say" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="rounded-xl border border-muted-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
          >
            <div className="mb-4 flex items-center gap-4">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/20">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <h4 className="font-heading text-base font-semibold text-secondary-800">
                  {testimonial.name}
                </h4>
                <StarRating rating={testimonial.rating} size="sm" />
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-600">
              &ldquo;{testimonial.review}&rdquo;
            </p>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
});

TestimonialSection.displayName = 'TestimonialSection';

export default TestimonialSection;
