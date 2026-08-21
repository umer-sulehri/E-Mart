import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/getSession';
import { getAddresses, setAddresses } from '../store';

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').optional(),
  street: z.string().min(1, 'Street is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  zip: z.string().min(1, 'ZIP code is required').optional(),
  country: z.string().min(1, 'Country is required').optional(),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const addresses = getAddresses(user.id);
  const index = addresses.findIndex((a) => a.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 });
  }

  if (parsed.data.isDefault) {
    addresses.forEach((a) => (a.isDefault = false));
  }

  addresses[index] = { ...addresses[index], ...parsed.data };
  setAddresses(user.id, addresses);

  return NextResponse.json({ address: addresses[index] }, { status: 200 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const addresses = getAddresses(user.id);
  const index = addresses.findIndex((a) => a.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 });
  }

  addresses.splice(index, 1);
  setAddresses(user.id, addresses);

  return NextResponse.json({ success: true, message: 'Address deleted' }, { status: 200 });
}
