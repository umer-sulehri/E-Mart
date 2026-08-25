import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name is too long"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name is too long"),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the terms" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const productFilterSchema = z.object({
  category: z.string().optional(),
  priceRange: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    })
    .optional(),
  rating: z.number().min(1).max(5).optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "rating", "newest", "popular"])
    .default("popular"),
  page: z.number().min(1).default(1),
});

export type ProductFilterInput = z.infer<typeof productFilterSchema>;

export const cartItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(99),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

export const addressSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  phone: z
    .string()
    .min(10, "Phone number is too short")
    .regex(/^(\+92|0)3\d{9}$/, "Please enter a valid Pakistani phone number"),
  address: z.string().min(5, "Address is too short"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(5, "Postal code is too short"),
  country: z.string().default("Pakistan"),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(["cod", "easypaisa", "jazzcash", "stripe"], {
    errorMap: () => ({ message: "Please select a payment method" }),
  }),
  shippingMethod: z.enum(["standard", "express", "same_day"], {
    errorMap: () => ({ message: "Please select a shipping method" }),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  title: z
    .string()
    .min(3, "Title is too short")
    .max(100, "Title is too long"),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(1000, "Review is too long"),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code is too short")
    .max(20, "Coupon code is too long")
    .toUpperCase(),
});

export type CouponInput = z.infer<typeof couponSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message is too long"),
});

export type ContactInput = z.infer<typeof contactSchema>;
