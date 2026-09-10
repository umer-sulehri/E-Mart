// ============================================================
// E-Mart - Supabase Row Types
// Snake_case mirrors of the database tables in supabase/schema.sql
// plus the commonly embedded join shapes returned by API routes.
// ============================================================

export interface ProfileRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: 'customer' | 'admin' | 'seller';
  profile_image_url?: string | null;
  date_of_birth?: string | null;
  is_email_verified: boolean;
  is_blocked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  display_order: number;
  product_count?: number;
  subcategories?: CategoryRow[];
  created_at: string;
  updated_at: string;
}

export interface VendorRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  contact_email: string;
  contact_phone?: string | null;
  address?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rating: number;
  total_sales: number;
  commission_rate: number;
  verified_at?: string | null;
  suspended_at?: string | null;
  rejected_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductRowStatus = 'active' | 'inactive' | 'draft' | 'archived';

export interface ProductRow {
  id: string;
  vendor_id?: string | null;
  name: string;
  slug: string;
  description: string;
  short_description?: string | null;
  sku?: string | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  brand_id?: string | null;
  price: number;
  discount_price?: number | null;
  stock_quantity: number;
  weight?: number | null;
  dimensions?: Record<string, unknown> | null;
  images: string[];
  specifications?: Record<string, unknown> | null;
  tags?: string[] | null;
  status: ProductRowStatus;
  moderation_status?: string;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
  // Embedded joins (from API select(...)):
  vendors?: { id: string; name: string } | null;
  profiles?: { first_name: string; last_name: string } | null;
  categories?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string } | null;
  brands?: { id: string; name: string } | null;
}

export interface CouponRow {
  id: string;
  code: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number | null;
  usage_limit?: number | null;
  used_count: number;
  per_user_limit?: number | null;
  applicable_product_ids?: string[] | null;
  applicable_category_ids?: string[] | null;
  exclude_product_ids?: string[] | null;
  is_active: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string | null;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  created_at: string;
  // Embedded joins:
  products?: { id: string; name: string; slug: string; sku?: string | null; images: string[]; price: number } | null;
  vendors?: { id: string; name: string } | null;
}

export interface OrderRow {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total: number;
  coupon_code?: string | null;
  shipping_address: unknown;
  billing_address?: unknown;
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  estimated_delivery?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Embedded joins:
  profiles?: ProfileRow | null;
  vendors?: VendorRow | null;
  order_items?: OrderItemRow[];
}

export interface ReviewRow {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  images?: string[] | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  status: 'pending' | 'approved' | 'flagged';
  seller_reply?: string | null;
  created_at: string;
  updated_at: string;
  // Embedded joins:
  products?: { id: string; name: string; slug: string; images: string[] } | null;
  profiles?: { id: string; first_name: string; last_name: string } | null;
}