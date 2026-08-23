import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { getStoreSettings, updateStoreSettings, DEFAULT_SETTINGS, StoreSettings } from '@/lib/settings/storeSettings';

const patchSchema = z.object({
  taxRate: z.number().min(0).max(1).optional(),
  shippingFee: z.number().min(0).optional(),
  freeShippingThreshold: z.number().min(0).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getStoreSettings();
  return NextResponse.json({ settings: { ...defaultAdminShape(), ...settings } });
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const patch = parsed.data as Partial<StoreSettings>;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No supported settings provided' }, { status: 400 });
  }
  await updateStoreSettings(patch);

  const settings = await getStoreSettings();
  return NextResponse.json({ settings: { ...defaultAdminShape(), ...settings } });
}

function defaultAdminShape() {
  // Non-commerce flags keep their previous defaults for the admin UI.
  return {
    platformName: 'E-Mart',
    supportEmail: 'support@emart.pk',
    defaultCurrency: 'PKR',
    emailNotifications: true,
    smsNotifications: true,
    autoApproveProducts: false,
    maintenanceMode: false,
    ...DEFAULT_SETTINGS,
  };
}
