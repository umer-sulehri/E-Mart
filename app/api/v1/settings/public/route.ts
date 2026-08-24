import { NextResponse } from 'next/server';
import { getStoreSettings } from '@/lib/settings/storeSettings';

export async function GET() {
  const {
    taxRate,
    shippingFee,
    freeShippingThreshold,
    contactPhone,
    contactEmail,
    contactAddress,
    supportHours,
  } = await getStoreSettings();
  return NextResponse.json(
    {
      taxRate,
      shippingFee,
      freeShippingThreshold,
      contactPhone,
      contactEmail,
      contactAddress,
      supportHours,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
