import { NextResponse } from 'next/server';
import { BlogPostRepository } from '@/lib/repositories/index';
import { BlogPost } from '@/lib/types';
import { mockBlogPosts } from '@/lib/mock/blog';

export async function GET() {
  let posts: BlogPost[] = [];
  try {
    posts = await BlogPostRepository.findPublished();
  } catch (e) {
    console.error('[blog-posts] findPublished failed:', e);
  }

  if (!posts.length) {
    // Content fallback: until real posts are published via the admin
    // dashboard, serve editorial seed content so the storefront never
    // shows a dead, empty blog.
    return NextResponse.json(mockBlogPosts, { status: 200 });
  }

  return NextResponse.json(posts, { status: 200 });
}
