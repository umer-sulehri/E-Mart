"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export interface NewsletterProps {
  className?: string;
}

const Newsletter = React.forwardRef<HTMLDivElement, NewsletterProps>(
  ({ className }, ref) => {
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!name.trim() || !email.trim()) {
        toast.error("Please fill in all fields");
        return;
      }

      setIsSubmitting(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        toast.success("Thank you for subscribing! Check your email for the 25% discount code.");
        setName("");
        setEmail("");
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <section ref={ref} className={cn("py-3", className)}>
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden rounded-lg bg-secondary py-5 text-light"
            style={{
              background: "url('/images/banner-newsletter.jpg') no-repeat",
              backgroundSize: "cover",
            }}
          >
            <div className="absolute inset-0 bg-secondary/90" />

            <div className="relative container mx-auto px-4">
              <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
                <div className="w-full p-3 md:w-5/12">
                  <div className="section-header">
                    <h2 className="display-5 font-heading text-2xl font-bold text-light md:text-3xl">
                      Get 25% Discount on your first purchase
                    </h2>
                  </div>
                  <p className="mt-3 text-white/80">
                    Just Sign Up &amp; Register it now to become member.
                  </p>
                </div>

                <div className="w-full p-3 md:w-5/12">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label sr-only">
                        Name
                      </label>
                      <input
                        type="text"
                        className="form-control w-full rounded-none border-0 bg-white p-3 text-sm text-secondary-800 placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        name="name"
                        id="name"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label sr-only">
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control w-full rounded-none border-0 bg-white p-3 text-sm text-secondary-800 placeholder:text-muted-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        name="email"
                        id="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-none bg-dark px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-secondary-700 disabled:pointer-events-none disabled:opacity-50"
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

Newsletter.displayName = "Newsletter";

export default Newsletter;
