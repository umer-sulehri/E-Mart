import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/repositories/index';
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
    const profile = await UserRepository.findById(user.id);
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user: profile }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireSeller();
    const body = await request.json();

    const allowedFields = ['name', 'phone', 'email', 'avatar'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await UserRepository.update(user.id, updates);
    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }
}
