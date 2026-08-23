import { NextResponse } from 'next/server';
import { BannerRepository } from '@/lib/repositories/index';

export async function GET() {
  const banners = await BannerRepository.findActive();
  return NextResponse.json(banners, { status: 200 });
}
