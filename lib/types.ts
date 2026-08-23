export interface Product {
  id: string;
  slug: string;
  name: string;
  nameUrdu?: string;
  description: string;
  descriptionUrdu?: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: Category;
  categoryId: string;
  stock: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  status?: string;
  createdAt: string;
  sellerId?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  nameUrdu?: string;
  icon: string;
  image?: string;
  parentId?: string;
  children?: Category[];
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: string;
  estimatedDelivery?: string;
  address: string;
  paymentMethod: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
  avatar?: string;
  status?: string;
  createdAt: string;
  isBlocked?: boolean;
  /** Seller store profile */
  storeName?: string;
  storeDescription?: string;
  businessAddress?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sellerId?: string;
  ids?: string[];
}

export interface Translation {
  key: string;
  en: string;
  ur: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  titleUrdu?: string;
  excerpt: string;
  excerptUrdu?: string;
  content: string;
  contentUrdu?: string;
  author: string;
  category: string;
  tags: string[];
  coverImage: string;
  readTime: number;
  publishedAt: string;
  updatedAt?: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type BannerSlot = 'hero' | 'promo-small' | 'promo-wide';

export interface Banner {
  id: string;
  slot: BannerSlot;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  badgeText?: string;
  ctaLabel?: string;
  ctaHref?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
