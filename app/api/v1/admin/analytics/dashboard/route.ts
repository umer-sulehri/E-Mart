import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getDashboardMetrics } from '@/lib/analytics/analyticsService';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const daysParam = Number(request.nextUrl.searchParams.get('days') ?? '30');
  const days = Number.isFinite(daysParam) && daysParam >= 7 && daysParam <= 90 ? Math.round(daysParam) : 30;

  const metrics = await getDashboardMetrics(days);
  return NextResponse.json({ metrics, rangeDays: days }, { status: 200 });
}
