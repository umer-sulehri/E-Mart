import { NextRequest, NextResponse } from 'next/server';
import { CategoryRepository } from '@/lib/repositories/index';
import { CreateCategorySchema } from '@/lib/validation/schemas';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const body = await request.json();
  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const category = CategoryRepository.create(parsed.data);
  return NextResponse.json({ category }, { status: 201 });
}
