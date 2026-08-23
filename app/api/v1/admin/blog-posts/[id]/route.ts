import { NextRequest, NextResponse } from 'next/server';
import { BlogPostRepository } from '@/lib/repositories/index';
import { updateBlogPostSchema } from '@/lib/validation/schemas';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateBlogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const post = await BlogPostRepository.update(id, parsed.data);
  return NextResponse.json({ post }, { status: 200 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const { id } = await params;
  await BlogPostRepository.delete(id);
  return NextResponse.json({ success: true }, { status: 200 });
}
