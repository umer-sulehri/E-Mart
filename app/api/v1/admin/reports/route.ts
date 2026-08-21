import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { buildSalesReport, buildProductsReport, buildCustomersReport } from '@/lib/analytics/analyticsService';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const params = request.nextUrl.searchParams;
  const type = params.get('type') ?? 'sales';
  const from = params.get('from') ?? undefined;
  const to = params.get('to') ?? undefined;

  let csv: string;
  switch (type) {
    case 'products':
      csv = await buildProductsReport();
      break;
    case 'customers':
      csv = await buildCustomersReport();
      break;
    case 'sales':
      csv = await buildSalesReport(from, to);
      break;
    default:
      return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="e-mart-${type}-report-${dateStamp}.csv"`,
    },
  });
}
