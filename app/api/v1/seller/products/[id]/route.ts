import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/lib/repositories/index';
import { UpdateProductSchema } from '@/lib/validation/schemas';
import { getSession } from '@/lib/auth/getSession';

async function requireSeller() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  if (user.role !== 'seller' && user.role !== 'admin') throw new Error('Forbidden');
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSeller();
    const { id } = await params;
    const product = await ProductRepository.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (user.role !== 'admin' && product.sellerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ product }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSeller();
    const { id } = await params;

    const existing = await ProductRepository.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (user.role !== 'admin' && existing.sellerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const product = await ProductRepository.update(id, parsed.data);
    return NextResponse.json({ product }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSeller();
    const { id } = await params;

    const existing = await ProductRepository.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (user.role !== 'admin' && existing.sellerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ProductRepository.delete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }
}
