import { NextRequest, NextResponse } from 'next/server';
import { CartRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  if (typeof body.quantity !== 'number' || body.quantity < 1) {
    return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 });
  }

  try {
    const item = await CartRepository.updateQuantity(user.id, id, body.quantity);
    return NextResponse.json({ item }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    await CartRepository.removeItem(user.id, id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
  }
}
