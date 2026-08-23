import { Review } from '@/lib/types';
import { ReviewRepository } from '../contracts/ReviewRepository';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export class SupabaseReviewRepository implements ReviewRepository {
  async findByProduct(productId: string): Promise<Review[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, profiles:user_id(name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      userName: (row.profiles as { name: string } | null)?.name ?? 'Anonymous',
      productId: row.product_id as string,
      rating: row.rating as number,
      comment: (row.comment as string) ?? '',
      createdAt: row.created_at as string,
      sellerReply: (row.seller_reply as string | null) ?? undefined,
      repliedAt: (row.replied_at as string | null) ?? undefined,
    }));
  }

  async create(data: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from('product_reviews')
      .insert({
        user_id: data.userId,
        product_id: data.productId,
        rating: data.rating,
        comment: data.comment,
      })
      .select('*, profiles:user_id(name)')
      .single();
    if (error) throw error;
    return {
      id: row.id as string,
      userId: row.user_id as string,
      userName: (row.profiles as { name: string } | null)?.name ?? 'Anonymous',
      productId: row.product_id as string,
      rating: row.rating as number,
      comment: (row.comment as string) ?? '',
      createdAt: row.created_at as string,
      sellerReply: (row.seller_reply as string | null) ?? undefined,
      repliedAt: (row.replied_at as string | null) ?? undefined,
    };
  }

  async findByUser(userId: string): Promise<Review[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, profiles:user_id(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      userName: (row.profiles as { name: string } | null)?.name ?? 'Anonymous',
      productId: row.product_id as string,
      rating: row.rating as number,
      comment: (row.comment as string) ?? '',
      createdAt: row.created_at as string,
      sellerReply: (row.seller_reply as string | null) ?? undefined,
      repliedAt: (row.replied_at as string | null) ?? undefined,
    }));
  }

  async findBySellerProducts(productIds: string[]): Promise<Review[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, profiles:user_id(name)')
      .in('product_id', productIds)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      userName: (row.profiles as { name: string } | null)?.name ?? 'Anonymous',
      productId: row.product_id as string,
      rating: row.rating as number,
      comment: (row.comment as string) ?? '',
      createdAt: row.created_at as string,
      sellerReply: (row.seller_reply as string | null) ?? undefined,
      repliedAt: (row.replied_at as string | null) ?? undefined,
    }));
  }

  async findRecent(limit: number = 20): Promise<(Review & { productName?: string; productSlug?: string })[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, profiles:user_id(name), products(name, slug)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      userName: (row.profiles as { name: string } | null)?.name ?? 'Anonymous',
      productId: row.product_id as string,
      productName: (row.products as { name: string } | null)?.name,
      productSlug: (row.products as { slug: string } | null)?.slug,
      rating: row.rating as number,
      comment: (row.comment as string) ?? '',
      createdAt: row.created_at as string,
      sellerReply: (row.seller_reply as string | null) ?? undefined,
      repliedAt: (row.replied_at as string | null) ?? undefined,
    }));
  }

  async update(
    id: string,
    userId: string,
    data: { rating?: number; comment?: string }
  ): Promise<Review | null> {
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (data.rating !== undefined) patch.rating = data.rating;
    if (data.comment !== undefined) patch.comment = data.comment;
    if (Object.keys(patch).length === 0) return null;

    const { data: row, error } = await supabase
      .from('product_reviews')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, profiles:user_id(name)')
      .single();
    if (error) return null;
    return {
      id: row.id as string,
      userId: row.user_id as string,
      userName: (row.profiles as { name: string } | null)?.name ?? 'Anonymous',
      productId: row.product_id as string,
      rating: row.rating as number,
      comment: (row.comment as string) ?? '',
      createdAt: row.created_at as string,
      sellerReply: (row.seller_reply as string | null) ?? undefined,
      repliedAt: (row.replied_at as string | null) ?? undefined,
    };
  }

  async findById(id: string): Promise<Review | null> {
    const supabase = await createClient();
    const { data } = await supabase
      .from('product_reviews')
      .select('*, profiles:user_id(name)')
      .eq('id', id)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id as string,
      userId: data.user_id as string,
      userName: (data.profiles as { name: string } | null)?.name ?? 'Anonymous',
      productId: data.product_id as string,
      rating: data.rating as number,
      comment: (data.comment as string) ?? '',
      createdAt: data.created_at as string,
    };
  }

  async addSellerReply(id: string, reply: string): Promise<Review | null> {
    // product_reviews RLS only lets authors update their rows, and replies are
    // written by the selling store — ownership is verified in the route, so
    // this write uses the service-role client.
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('product_reviews')
      .update({ seller_reply: reply, replied_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, profiles:user_id(name)')
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id as string,
      userId: data.user_id as string,
      userName: (data.profiles as { name: string } | null)?.name ?? 'Anonymous',
      productId: data.product_id as string,
      rating: data.rating as number,
      comment: (data.comment as string) ?? '',
      createdAt: data.created_at as string,
      sellerReply: (data.seller_reply as string | null) ?? undefined,
      repliedAt: (data.replied_at as string | null) ?? undefined,
    };
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
