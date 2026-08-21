import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/repositories/index';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(
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
  const user = await UserRepository.findById(id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ user }, { status: 200 });
}

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
  const { name, email, phone, role } = body as {
    name?: string;
    email?: string;
    phone?: string;
    role?: 'buyer' | 'seller' | 'admin';
  };

  const updateData: Record<string, string> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (role !== undefined) updateData.role = role;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    const user = await UserRepository.update(id, updateData);
    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
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
  try {
    const user = await UserRepository.update(id, { isBlocked: true } as never);
    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
}
