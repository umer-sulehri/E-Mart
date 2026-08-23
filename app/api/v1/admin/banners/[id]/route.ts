import { NextRequest, NextResponse } from 'next/server';
import { BannerRepository } from '@/lib/repositories/index';
import { updateBannerSchema } from '@/lib/validation/schemas';
import { requireAdmin } from '@/lib/auth/requireAdmin';

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
  const parsed = updateBannerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const banner = await BannerRepository.update(id, parsed.data);
  return NextResponse.json({ banner }, { status: 200 });
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
  await BannerRepository.delete(id);
  return NextResponse.json({ success: true }, { status: 200 });
}
