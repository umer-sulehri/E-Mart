// ============================================================
// E-Mart - Comprehensive Type Definitions
// ============================================================

// ========================
// User Types
// ========================

export type UserRole = 'customer' | 'admin' | 'seller';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  profileImageUrl?: string;
  dateOfBirth?: string;
  addresses?: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface UserUpdateInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;
  dateOfBirth?: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ========================
// Address Types
// ========================

export interface Address {
  id: string;
  userId: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AddressCreateInput = Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

// ========================
// Category Types
// ========================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  categoryId: string;
  category?: Category;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ========================
// Brand Types
// ========================

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================
// Vendor Types
// ========================

export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  status: VendorStatus;
  userId: string;
  user?: User;
  rating: number;
  totalSales: number;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
}

// ========================
// Product Types
// ========================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  sku: string;
  category: Category;
  categoryId: string;
  subcategory?: Subcategory;
  subcategoryId?: string;
  brand?: Brand;
  brandId?: string;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  images: string[];
  specifications?: Record<string, string>;
  vendor?: Vendor;
  vendorId?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'mm';
}

export type ProductStatus = 'active' | 'inactive' | 'draft' | 'archived';

export interface ProductCreateInput {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
  sku: string;
  categoryId: string;
  subcategoryId?: string;
  brandId?: string;
  vendorId?: string;
  images: string[];
  specifications?: Record<string, string>;
  isFeatured?: boolean;
  isNew?: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  tags?: string[];
}

export type ProductUpdateInput = Partial<ProductCreateInput> & { id: string };

// ========================
// Cart Types
// ========================

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedAt: string;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartAddInput {
  productId: string;
  quantity: number;
}

export interface CartUpdateInput {
  cartItemId: string;
  quantity: number;
}

// ========================
// Order Types
// ========================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'cash_on_delivery' | 'bank_transfer';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user?: User;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  couponCode?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  trackingNumber?: string;
  shippingCarrier?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderCreateInput {
  items: { productId: string; quantity: number }[];
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
}

// ========================
// Review Types
// ========================

export interface Review {
  id: string;
  userId: string;
  user?: User;
  productId: string;
  product?: Product;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCreateInput {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface ReviewUpdateInput {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

// ========================
// Wishlist Types
// ========================

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product?: Product;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

// ========================
// Coupon Types
// ========================

export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
  excludeProductIds?: string[];
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidation {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message?: string;
}

// ========================
// Banner Types
// ========================

export type BannerPosition = 'home_top' | 'home_middle' | 'home_bottom' | 'category_page' | 'sidebar';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  position: BannerPosition;
  isActive: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ========================
// Blog Types
// ========================

export type BlogStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  authorId: string;
  author?: User;
  category: string;
  tags: string[];
  status: BlogStatus;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  content: string;
  parentId?: string;
  replies?: BlogComment[];
  createdAt: string;
  updatedAt: string;
}

// ========================
// Notification Types
// ========================

export type NotificationType =
  | 'order_placed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'promo'
  | 'system'
  | 'review_received';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ========================
// Product Tag Types
// ========================

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

// ========================
// Filter Types
// ========================

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  vendorId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  sortBy?: ProductSortOption;
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
}

export type ProductSortOption =
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'newest'
  | 'popularity'
  | 'name_asc'
  | 'name_desc';

export interface CategoryFilters {
  search?: string;
  isActive?: boolean;
  parentId?: string;
}

// ========================
// Pagination Types
// ========================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ========================
// API Response Types
// ========================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  meta?: PaginationMeta;
  errors?: ApiError[];
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface ApiListResponse<T = unknown> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
  timestamp: string;
}

// ========================
// Dashboard / Analytics Types
// ========================

export interface DashboardMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalCustomers: number;
  customersGrowth: number;
  averageOrderValue: number;
  avgOrderValueGrowth: number;
  conversionRate: number;
  conversionRateGrowth: number;
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  productImage: string;
  totalSold: number;
  revenue: number;
}

export interface OrderStatusBreakdown {
  status: OrderStatus;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ========================
// Search Types
// ========================

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  suggestions: string[];
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand';
  imageUrl?: string;
}

// ========================
// Common Utility Types
// ========================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TabOption {
  value: string;
  label: string;
  icon?: string;
  count?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface ImageFile {
  file: File;
  preview: string;
  alt?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ========================
// Store Types (Zustand)
// ========================

export interface CartStore {
  cart: Cart | null;
  isLoading: boolean;
  addItem: (input: CartAddInput) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (input: CartUpdateInput) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<CouponValidation>;
  removeCoupon: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

export interface UIStore {
  isSidebarOpen: boolean;
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  toggleSidebar: () => void;
  toggleCart: () => void;
  toggleSearch: () => void;
  toggleMobileMenu: () => void;
}

// ========================
// Supabase Database Types
// ========================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserCreateInput;
        Update: UserUpdateInput;
      };
      products: {
        Row: Product;
        Insert: ProductCreateInput;
        Update: Partial<ProductCreateInput>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      orders: {
        Row: Order;
        Insert: OrderCreateInput;
        Update: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      reviews: {
        Row: Review;
        Insert: ReviewCreateInput;
        Update: ReviewUpdateInput;
      };
      coupons: {
        Row: Coupon;
        Insert: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'isRead' | 'createdAt'>;
        Update: Partial<Pick<Notification, 'isRead'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      coupon_type: CouponType;
      banner_position: BannerPosition;
      blog_status: BlogStatus;
      notification_type: NotificationType;
      vendor_status: VendorStatus;
    };
  };
}
