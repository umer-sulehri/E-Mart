import { NextRequest, NextResponse } from 'next/server';
import { BlogPostRepository } from '@/lib/repositories/index';
import { createBlogPostSchema } from '@/lib/validation/schemas';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const posts = await BlogPostRepository.findAll();
  return NextResponse.json(posts, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const body = await request.json();
  const parsed = createBlogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const post = await BlogPostRepository.create(parsed.data);
  return NextResponse.json({ post }, { status: 201 });
}
