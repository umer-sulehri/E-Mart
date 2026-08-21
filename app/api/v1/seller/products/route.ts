import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/lib/repositories/index';
import { productCreateSchema } from '@/lib/validation/schemas';
import { getSession } from '@/lib/auth/getSession';

async function requireSeller() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  if (user.role !== 'seller' && user.role !== 'admin') throw new Error('Forbidden');
  return user;
}

export async function GET() {
  try {
    const user = await requireSeller();
    const result = await ProductRepository.findAll({ sellerId: user.id });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSeller();

    const body = await request.json();
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const product = await ProductRepository.create({
      ...parsed.data,
      sellerId: user.id,
    } as never);
    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }
}
