import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency: string = "PKR"): string {
  if (currency === "PKR") {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "...";
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `EM-${year}-${random}`;
}

export function calculateDiscount(
  price: number,
  discountPrice: number
): number {
  if (price <= 0 || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

/**
 * The pair of numbers a price cell should render.
 *
 * `discount_price` is nullable and nothing constrains it to be lower than
 * `price`, so a row can legitimately hold `price === discount_price` (or an
 * out-of-range value from a bad seller import). Every price cell used to branch
 * on `discountPrice` being present, which produced the "Rs. 24,999Rs. 24,999"
 * rendering on the compare page: a strike-through original next to a sale price
 * that was the same figure. Branching on `original` being non-null makes the
 * two numbers agree by construction — the original is only ever returned when it
 * is genuinely higher, so a duplicated or inverted pair is unrepresentable.
 *
 * Centralised so the card, the quick view, both wishlists, the compare table
 * and the cart cannot each re-derive the condition differently.
 */
export function resolvePriceDisplay(
  price: number,
  discountPrice?: number | null
): { current: number; original: number | null; discountPercent: number } {
  if (discountPrice != null && price > 0 && discountPrice < price) {
    return {
      current: discountPrice,
      original: price,
      discountPercent: calculateDiscount(price, discountPrice),
    };
  }
  return { current: price, original: null, discountPercent: 0 };
}
