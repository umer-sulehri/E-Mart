import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const translationsStore: Record<string, { en: string; ur: string }> = {};

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  return NextResponse.json({ translations: translationsStore });
}

export async function PUT(request: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const body = await request.json();
  if (body.translations) {
    Object.assign(translationsStore, body.translations);
  }
  return NextResponse.json({ success: true });
}
