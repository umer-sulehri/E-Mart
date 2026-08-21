import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const settingsStore: Record<string, unknown> = {
  platformName: 'E-Mart',
  supportEmail: 'support@emart.pk',
  defaultCurrency: 'PKR',
  taxRate: 0,
  shippingFee: 150,
  freeShippingThreshold: 2000,
  emailNotifications: true,
  smsNotifications: true,
  autoApproveProducts: false,
  maintenanceMode: false,
};

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  return NextResponse.json({ settings: settingsStore });
}

export async function PUT(request: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  const body = await request.json();
  Object.assign(settingsStore, body);
  return NextResponse.json({ settings: settingsStore });
}
