import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/repositories/index';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function POST(
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
    const user = await UserRepository.unblock(id);
    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
}
