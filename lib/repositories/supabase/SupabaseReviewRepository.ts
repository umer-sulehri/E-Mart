import { Review } from '@/lib/types';
import { ReviewRepository } from '../contracts/ReviewRepository';
import { createClient } from '@/lib/supabase/server';

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
