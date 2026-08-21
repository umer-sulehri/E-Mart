import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/repositories/index';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));

  const allUsers = await UserRepository.findAll();
  const total = allUsers.length;
  const start = (page - 1) * limit;
  const users = allUsers.slice(start, start + limit);

  return NextResponse.json({ users, total }, { status: 200 });
}
