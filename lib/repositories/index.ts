import { LocalProductRepository } from './local/LocalProductRepository';
import { LocalCategoryRepository } from './local/LocalCategoryRepository';
import { LocalCartRepository } from './local/LocalCartRepository';
import { LocalOrderRepository } from './local/LocalOrderRepository';
import { LocalUserRepository } from './local/LocalUserRepository';
import { LocalWishlistRepository } from './local/LocalWishlistRepository';
import { LocalReviewRepository } from './local/LocalReviewRepository';
import { LocalTranslationRepository } from './local/LocalTranslationRepository';
import { LocalOtpRepository } from './local/LocalOtpRepository';
import { LocalNotificationPreferencesRepository } from './local/LocalNotificationPreferencesRepository';
import { LocalSocialLinkRepository } from './local/LocalSocialLinkRepository';
import { LocalBannerRepository } from './local/LocalBannerRepository';
import { LocalBlogPostRepository } from './local/LocalBlogPostRepository';

import { SupabaseProductRepository } from './supabase/SupabaseProductRepository';
import { SupabaseCategoryRepository } from './supabase/SupabaseCategoryRepository';
import { SupabaseCartRepository } from './supabase/SupabaseCartRepository';
import { SupabaseOrderRepository } from './supabase/SupabaseOrderRepository';
import { SupabaseUserRepository } from './supabase/SupabaseUserRepository';
import { SupabaseWishlistRepository } from './supabase/SupabaseWishlistRepository';
import { SupabaseReviewRepository } from './supabase/SupabaseReviewRepository';
import { SupabaseTranslationRepository } from './supabase/SupabaseTranslationRepository';
import { SupabaseNotificationPreferencesRepository } from './supabase/SupabaseNotificationPreferencesRepository';
import { SupabaseSocialLinkRepository } from './supabase/SupabaseSocialLinkRepository';
import { SupabaseBannerRepository } from './supabase/SupabaseBannerRepository';
import { SupabaseBlogPostRepository } from './supabase/SupabaseBlogPostRepository';

export type { ProductFilters } from './contracts/ProductRepository';
export type { TranslationEntry } from './contracts/TranslationRepository';

function isRealSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return (
    url.length > 0 &&
    key.length > 0 &&
    !url.includes('your-') &&
    !key.includes('your-') &&
    url.startsWith('http')
  );
}
const useSupabase = isRealSupabaseConfig();

const productRepo = useSupabase ? new SupabaseProductRepository() : new LocalProductRepository();
const categoryRepo = useSupabase ? new SupabaseCategoryRepository() : new LocalCategoryRepository();
const cartRepo = useSupabase ? new SupabaseCartRepository() : new LocalCartRepository();
const orderRepo = useSupabase ? new SupabaseOrderRepository() : new LocalOrderRepository();
const userRepo = useSupabase ? new SupabaseUserRepository() : new LocalUserRepository();
const wishlistRepo = useSupabase ? new SupabaseWishlistRepository() : new LocalWishlistRepository();
const reviewRepo = useSupabase ? new SupabaseReviewRepository() : new LocalReviewRepository();
const translationRepo = useSupabase ? new SupabaseTranslationRepository() : new LocalTranslationRepository();
const otpRepo = new LocalOtpRepository();
const notifPrefsRepo = useSupabase ? new SupabaseNotificationPreferencesRepository() : new LocalNotificationPreferencesRepository();
const socialLinkRepo = useSupabase ? new SupabaseSocialLinkRepository() : new LocalSocialLinkRepository();
const bannerRepo = useSupabase ? new SupabaseBannerRepository() : new LocalBannerRepository();
const blogPostRepo = useSupabase ? new SupabaseBlogPostRepository() : new LocalBlogPostRepository();

export { productRepo as ProductRepository };
export { categoryRepo as CategoryRepository };
export { cartRepo as CartRepository };
export { orderRepo as OrderRepository };
export { userRepo as UserRepository };
export { wishlistRepo as WishlistRepository };
export { reviewRepo as ReviewRepository };
export { translationRepo as TranslationRepository };
export { otpRepo as OtpRepository };
export { notifPrefsRepo as NotificationPreferencesRepository };
export { socialLinkRepo as SocialLinkRepository };
export { bannerRepo as BannerRepository };
export { blogPostRepo as BlogPostRepository };

export function getProductRepository() { return productRepo; }
export function getCategoryRepository() { return categoryRepo; }
export function getCartRepository() { return cartRepo; }
export function getOrderRepository() { return orderRepo; }
export function getUserRepository() { return userRepo; }
export function getWishlistRepository() { return wishlistRepo; }
export function getReviewRepository() { return reviewRepo; }
export function getTranslationRepository() { return translationRepo; }
export function getNotificationPreferencesRepository() { return notifPrefsRepo; }
export function getSocialLinkRepository() { return socialLinkRepo; }
export function getBannerRepository() { return bannerRepo; }
export function getBlogPostRepository() { return blogPostRepo; }
