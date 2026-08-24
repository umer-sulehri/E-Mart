import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional(),
  email: z.string().email('Invalid email address').optional(),
}).refine((data) => data.phone || data.email, {
  message: 'Either phone or email is required',
});

export const LoginSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional(),
  email: z.string().email('Invalid email address').optional(),
}).refine((data) => data.phone || data.email, {
  message: 'Either phone or email is required',
});

/** Pakistan mobile number: 03XX-XXXXXXX or +92-3XX-XXXXXXX (separator optional). */
export const pkPhoneRegex = /^(?:\+92[-\s]?|0)3\d{2}[-\s]?\d{7}$/;

/** Strong password shared by registration / reset / change flows. */
export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

/** Registration payload — verification itself is handled by Supabase email. */
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Invalid email address').max(200),
  password: strongPasswordSchema,
  userType: z.enum(['customer', 'seller']).default('customer'),
  phone: z.string().regex(pkPhoneRegex, 'Enter a valid Pakistani mobile number (e.g. +92-300-1234567)').optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(200),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(200),
});

export const loginCredentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const orderItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  productImage: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
});

export const CreateOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  address: z.string().min(5, 'Address is required'),
  paymentMethod: z.enum(['cod', 'stripe', 'jazzcash', 'easypaisa', 'card', 'transfer']),
});

export const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  address: z.string().min(5, 'Address is required'),
  paymentMethod: z.enum(['cod', 'stripe', 'jazzcash', 'easypaisa', 'card', 'transfer']),
});

export const orderUpdateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameUrdu: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  descriptionUrdu: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  categoryId: z.string().min(1, 'Category is required'),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

export const productCreateSchema = CreateProductSchema;

export const productUpdateSchema = CreateProductSchema.partial();

export const productBulkCreateSchema = z.object({
  products: z.array(CreateProductSchema).min(1, 'At least one product is required'),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const CreateReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(1, 'Comment is required').max(500, 'Comment is too long'),
});

export const reviewCreateSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(1, 'Comment is required').max(500, 'Comment is too long'),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameUrdu: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  icon: z.string().min(1, 'Icon is required'),
  image: z.string().url().optional(),
  parentId: z.string().optional(),
});

export const categoryCreateSchema = CreateCategorySchema;

export const categoryUpdateSchema = CreateCategorySchema.partial();

export const SearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
});

export const cartItemAddSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive().default(1),
});

export const cartItemUpdateSchema = z.object({
  quantity: z.number().int().positive(),
});

export const wishlistAddSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

export const paymentProcessSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  method: z.string(),
});

export const codProcessSchema = z.object({
  orderId: z.string(),
});

export const voiceSearchSchema = z.object({
  query: z.string().min(1, 'Voice query is required'),
});

export const notificationPrefsUpdateSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  orderUpdates: z.boolean().optional(),
  promotions: z.boolean().optional(),
});

export const createSocialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  label: z.string().min(1, 'Label is required'),
  url: z.string().url('Must be a valid URL'),
  icon: z.string().min(1, 'Icon identifier is required'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateSocialLinkSchema = createSocialLinkSchema.partial();

export const createBannerSchema = z.object({
  slot: z.enum(['hero', 'promo-small', 'promo-wide']).default('hero'),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  badgeText: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateBannerSchema = createBannerSchema.partial();

export const createBlogPostSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  title: z.string().min(1, 'Title is required'),
  excerpt: z.string().min(1, 'Excerpt is required'),
  content: z.string().min(1, 'Content is required'),
  author: z.string().default('E-Mart Team'),
  category: z.string().default('general'),
  tags: z.array(z.string()).default([]),
  coverImage: z.string().default('/images/post-thumb-1.jpg'),
  readTime: z.number().int().positive().default(4),
});

export const updateBlogPostSchema = createBlogPostSchema.partial().extend({
  isPublished: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  // Current password only needs to be present; legacy accounts may have
  // weaker passwords than the new policy requires.
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: strongPasswordSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number').optional(),
  email: z.string().email('Invalid email address').optional(),
});
