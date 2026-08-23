import { BlogPost } from '@/lib/types';
import { BlogPostRepository } from '../contracts/BlogPostRepository';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function mapRow(row: Record<string, unknown>): BlogPost {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    titleUrdu: (row.title_urdu as string) ?? undefined,
    excerpt: (row.excerpt as string) ?? '',
    excerptUrdu: (row.excerpt_urdu as string) ?? undefined,
    content: (row.content as string) ?? '',
    contentUrdu: (row.content_urdu as string) ?? undefined,
    author: (row.author as string) ?? 'E-Mart Team',
    category: (row.category as string) ?? 'general',
    tags: (row.tags as string[]) ?? [],
    coverImage: (row.cover_image as string) ?? '/images/post-thumb-1.jpg',
    readTime: (row.read_time as number) ?? 4,
    publishedAt: (row.published_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? undefined,
  };
}

function isMissingTable(error: { message?: string; code?: string }): boolean {
  return error.code === '42P01' || /relation .* does not exist|schema cache/i.test(error.message ?? '');
}

export class SupabaseBlogPostRepository implements BlogPostRepository {
  async findAll(): Promise<BlogPost[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return (data ?? []).map(mapRow);
  }

  async findPublished(): Promise<BlogPost[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return (data ?? []).map(mapRow);
  }

  async findBySlug(slug: string): Promise<BlogPost | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error && !isMissingTable(error)) throw error;
    if (data) return mapRow(data);
    const admin = await createAdminClient();
    const { data: adminRow } = await admin.from('blog_posts').select('*').eq('slug', slug).maybeSingle();
    if (!adminRow && error && isMissingTable(error)) return null;
    return adminRow ? mapRow(adminRow) : null;
  }

  async findById(id: string): Promise<BlogPost | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error && !isMissingTable(error)) throw error;
    if (data) return mapRow(data);
    const admin = await createAdminClient();
    const { data: adminRow } = await admin.from('blog_posts').select('*').eq('id', id).maybeSingle();
    return adminRow ? mapRow(adminRow) : null;
  }

  async create(
    data: Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt'> & { publishedAt?: string },
  ): Promise<BlogPost> {
    const payload = {
      slug: data.slug,
      title: data.title,
      title_urdu: data.titleUrdu ?? null,
      excerpt: data.excerpt,
      excerpt_urdu: data.excerptUrdu ?? null,
      content: data.content,
      content_urdu: data.contentUrdu ?? null,
      author: data.author,
      category: data.category,
      tags: data.tags,
      cover_image: data.coverImage,
      read_time: data.readTime,
      is_published: true,
      published_at: data.publishedAt ?? new Date().toISOString(),
    };
    let res = await (await createClient()).from('blog_posts').insert(payload).select().single();
    if ((res.error && /row-level security/i.test(res.error.message)) || !res.data) {
      res = await (await createAdminClient()).from('blog_posts').insert(payload).select().single();
    }
    if (res.error) throw res.error;
    return mapRow(res.data!);
  }

  async update(id: string, data: Partial<Omit<BlogPost, 'id'>> & { isPublished?: boolean }): Promise<BlogPost> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.slug !== undefined) patch.slug = data.slug;
    if (data.title !== undefined) patch.title = data.title;
    if (data.titleUrdu !== undefined) patch.title_urdu = data.titleUrdu;
    if (data.excerpt !== undefined) patch.excerpt = data.excerpt;
    if (data.excerptUrdu !== undefined) patch.excerpt_urdu = data.excerptUrdu;
    if (data.content !== undefined) patch.content = data.content;
    if (data.contentUrdu !== undefined) patch.content_urdu = data.contentUrdu;
    if (data.author !== undefined) patch.author = data.author;
    if (data.category !== undefined) patch.category = data.category;
    if (data.tags !== undefined) patch.tags = data.tags;
    if (data.coverImage !== undefined) patch.cover_image = data.coverImage;
    if (data.readTime !== undefined) patch.read_time = data.readTime;
    if ((data as { isPublished?: boolean }).isPublished !== undefined) {
      patch.is_published = (data as { isPublished?: boolean }).isPublished;
    }

    try {
      const res = await (await createClient()).from('blog_posts').update(patch).eq('id', id).select().single();
      if (res.data) return mapRow(res.data);
    } catch {
      /* fall through to admin */
    }
    const admin = await createAdminClient();
    const res2 = await admin.from('blog_posts').update(patch).eq('id', id).select().single();
    if (res2.error) throw res2.error;
    return mapRow(res2.data!);
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    await supabase.from('blog_posts').delete().eq('id', id);
    const admin = await createAdminClient();
    const { data: still } = await admin.from('blog_posts').select('id').eq('id', id).maybeSingle();
    if (still) {
      const { error } = await admin.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    }
  }
}
