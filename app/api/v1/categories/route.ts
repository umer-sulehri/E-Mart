import { NextResponse } from 'next/server';
import { CategoryRepository } from '@/lib/repositories/index';

export async function GET() {
  const categories = await CategoryRepository.findAll();
  return NextResponse.json({ categories }, { status: 200 });
}
