import { TranslationEntry, TranslationRepository } from '../contracts/TranslationRepository';
import { createClient } from '@/lib/supabase/server';

export class SupabaseTranslationRepository implements TranslationRepository {
  async findAll(): Promise<TranslationEntry[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('translations')
      .select('key, en, ur')
      .order('key');
    if (error) throw error;
    return (data ?? []).map((row) => ({
      key: row.key as string,
      en: (row.en as string) ?? '',
      ur: (row.ur as string) ?? '',
    }));
  }

  async findByKey(key: string): Promise<TranslationEntry | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('translations')
      .select('key, en, ur')
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      key: data.key as string,
      en: (data.en as string) ?? '',
      ur: (data.ur as string) ?? '',
    };
  }

  async upsert(key: string, en: string, ur: string): Promise<TranslationEntry> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('translations')
      .upsert({ key, en, ur }, { onConflict: 'key' })
      .select('key, en, ur')
      .single();
    if (error) throw error;
    return {
      key: data.key as string,
      en: (data.en as string) ?? '',
      ur: (data.ur as string) ?? '',
    };
  }

  async delete(key: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('translations')
      .delete()
      .eq('key', key);
    if (error) throw error;
  }
}
