export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface MyReviewData {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
  status: ReviewStatus;
  seller_reply: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
  } | null;
}

export interface ReviewableProduct {
  slug: string;
  name: string;
}

export const statusVariant: Record<ReviewStatus, 'success' | 'warning' | 'danger' | 'primary'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  flagged: 'warning',
};

export const statusLabels: Record<ReviewStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  flagged: 'Flagged',
};

export const ratingLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};