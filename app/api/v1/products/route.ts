import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository } from '@/lib/repositories/index';
import { ProductFilters } from '@/lib/repositories/index';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filters: ProductFilters = {};

  if (searchParams.get('category')) filters.category = searchParams.get('category')!;
  if (searchParams.get('minPrice')) filters.minPrice = Number(searchParams.get('minPrice'));
  if (searchParams.get('maxPrice')) filters.maxPrice = Number(searchParams.get('maxPrice'));
  if (searchParams.get('search')) filters.search = searchParams.get('search')!;
  if (searchParams.get('sort')) filters.sort = searchParams.get('sort')!;

  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;

  const result = await ProductRepository.findAll(filters, page, limit);
  return NextResponse.json(result, { status: 200 });
}
