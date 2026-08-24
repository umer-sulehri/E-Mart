import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ProductRepository } from '@/lib/repositories/index';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const moderationSchema = z.object({
  status: z.enum(['active', 'rejected']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = moderationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  try {
    const product = await ProductRepository.update(id, { status: parsed.data.status });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ product }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update product status' }, { status: 500 });
  }
}
