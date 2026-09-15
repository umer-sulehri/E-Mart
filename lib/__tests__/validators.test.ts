import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  cartItemSchema,
  addressSchema,
  checkoutSchema,
  reviewSchema,
  couponSchema,
  newsletterSchema,
  contactSchema,
} from "../validators";

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "StrongP@ss1",
      confirmPassword: "StrongP@ss1",
      firstName: "John",
      lastName: "Doe",
      agreeToTerms: true,
      role: "customer",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "StrongP@ss1",
      confirmPassword: "StrongP@ss2",
      firstName: "John",
      lastName: "Doe",
      agreeToTerms: true,
      role: "customer",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects a weak password", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "weak",
      confirmPassword: "weak",
      firstName: "John",
      lastName: "Doe",
      agreeToTerms: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires terms agreement", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "StrongP@ss1",
      confirmPassword: "StrongP@ss1",
      firstName: "John",
      lastName: "Doe",
      agreeToTerms: false,
    });
    expect(result.success).toBe(false);
  });

  it("allows optional seller store name", () => {
    const result = registerSchema.safeParse({
      email: "seller@example.com",
      password: "StrongP@ss1",
      confirmPassword: "StrongP@ss1",
      firstName: "Sam",
      lastName: "Seller",
      agreeToTerms: true,
      role: "seller",
      storeName: "Green Farms",
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "StrongP@ss1",
      role: "customer",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid role", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "StrongP@ss1",
      role: "superadmin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "StrongP@ss1",
      role: "customer",
    });
    expect(result.success).toBe(false);
  });

  it("requires a password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
      role: "customer",
    });
    expect(result.success).toBe(false);
  });
});

describe("cartItemSchema", () => {
  it("accepts a valid cart item", () => {
    const result = cartItemSchema.safeParse({
      productId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = cartItemSchema.safeParse({ productId: "not-a-uuid", quantity: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects quantity below 1", () => {
    const result = cartItemSchema.safeParse({
      productId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity above 99", () => {
    const result = cartItemSchema.safeParse({
      productId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe("addressSchema", () => {
  it("accepts a valid Pakistani address", () => {
    const result = addressSchema.safeParse({
      fullName: "John Doe",
      phone: "03001234567",
      address: "House 10, Street 5, Gulberg",
      city: "Lahore",
      state: "Punjab",
      postalCode: "54000",
      country: "Pakistan",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid Pakistani phone number", () => {
    const result = addressSchema.safeParse({
      fullName: "John Doe",
      phone: "12345",
      address: "House 10",
      city: "Lahore",
      state: "Punjab",
      postalCode: "54000",
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("accepts a valid review", () => {
    const result = reviewSchema.safeParse({
      rating: 5,
      title: "Excellent product",
      comment: "This organic product exceeded my expectations in every way.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects rating of 0", () => {
    const result = reviewSchema.safeParse({
      rating: 0,
      title: "Bad",
      comment: "This is not a good product at all.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a title that is too short", () => {
    const result = reviewSchema.safeParse({
      rating: 4,
      title: "OK",
      comment: "Acceptable product with reasonable quality overall.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a short comment", () => {
    const result = reviewSchema.safeParse({
      rating: 3,
      title: "Decent",
      comment: "Fine",
    });
    expect(result.success).toBe(false);
  });
});

describe("couponSchema", () => {
  it("uppercases coupon codes", () => {
    const result = couponSchema.safeParse({ code: "save10" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.code).toBe("SAVE10");
  });

  it("rejects short coupon codes", () => {
    const result = couponSchema.safeParse({ code: "ab" });
    expect(result.success).toBe(false);
  });
});

describe("newsletterSchema", () => {
  it("accepts a valid email", () => {
    expect(newsletterSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(newsletterSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

describe("contactSchema", () => {
  it("accepts a valid contact submission", () => {
    const result = contactSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      subject: "Question about delivery",
      message: "How long does standard delivery take?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short message", () => {
    const result = contactSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      subject: "Question",
      message: "Hi",
    });
    expect(result.success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  it("accepts a valid checkout payload", () => {
    const shipping = {
      fullName: "John Doe",
      phone: "03001234567",
      address: "House 10, Street 5",
      city: "Lahore",
      state: "Punjab",
      postalCode: "54000",
      country: "Pakistan",
    };
    const result = checkoutSchema.safeParse({
      shippingAddress: shipping,
      paymentMethod: "cod",
      shippingMethod: "standard",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid payment method", () => {
    const shipping = {
      fullName: "John Doe",
      phone: "03001234567",
      address: "House 10, Street 5",
      city: "Lahore",
      state: "Punjab",
      postalCode: "54000",
    };
    const result = checkoutSchema.safeParse({
      shippingAddress: shipping,
      paymentMethod: "bitcoin",
      shippingMethod: "standard",
    });
    expect(result.success).toBe(false);
  });
});