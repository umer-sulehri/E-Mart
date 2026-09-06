import { z } from 'zod';

export const shippingSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  saveDefault: z.boolean().optional(),
});

export const paymentSchema = z.object({
  method: z.enum(['easypaisa', 'jazzcash', 'card', 'cod']),
  easypaisaAccount: z.string().optional(),
  jazzcashMobile: z.string().optional(),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
});

export const reviewSchema = z.object({
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms & conditions' }),
  }),
});

export type ShippingFormData = z.infer<typeof shippingSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;

export type PaymentMethodId = PaymentFormData['method'];

export const PAYMENT_LABELS: Record<PaymentMethodId, string> = {
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
  card: 'Credit / Debit Card',
  cod: 'Cash on Delivery',
};

export function fieldErrors(
  result: z.SafeParseReturnType<unknown, unknown>
): Record<string, string> {
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}