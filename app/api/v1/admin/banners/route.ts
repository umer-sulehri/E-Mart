import { NextRequest, NextResponse } from 'next/server';
import { BannerRepository } from '@/lib/repositories/index';
import { createBannerSchema } from '@/lib/validation/schemas';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const banners = await BannerRepository.findAll();
  return NextResponse.json(banners, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const body = await request.json();
  const parsed = createBannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const banner = await BannerRepository.create(parsed.data);
  return NextResponse.json({ banner }, { status: 201 });
}
