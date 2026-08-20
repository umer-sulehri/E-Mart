import { NextRequest, NextResponse } from 'next/server';
import { CategoryRepository } from '@/lib/repositories/index';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const children = await CategoryRepository.findChildren(id);
  return NextResponse.json({ children }, { status: 200 });
}
