import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/getSession';
import { getAddresses, setAddresses, type Address } from './store';

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const addresses = getAddresses(user.id);
  return NextResponse.json({ addresses }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const addresses = getAddresses(user.id);

  if (parsed.data.isDefault) {
    addresses.forEach((a) => (a.isDefault = false));
  }

  const newAddress: Address = {
    id: crypto.randomUUID(),
    ...parsed.data,
    isDefault: parsed.data.isDefault ?? addresses.length === 0,
  };

  addresses.push(newAddress);
  setAddresses(user.id, addresses);

  return NextResponse.json({ address: newAddress }, { status: 201 });
}
