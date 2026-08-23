import { NextResponse } from 'next/server';
import { BlogPostRepository } from '@/lib/repositories/index';

export async function GET() {
  const posts = await BlogPostRepository.findPublished();
  return NextResponse.json(posts, { status: 200 });
}
