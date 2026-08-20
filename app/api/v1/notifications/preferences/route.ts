import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';

const defaults = { email: true, sms: true, push: true };

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ preferences: defaults }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (typeof body.email !== 'boolean' || typeof body.sms !== 'boolean' || typeof body.push !== 'boolean') {
    return NextResponse.json({ error: 'email, sms, and push must be booleans' }, { status: 400 });
  }

  return NextResponse.json({ preferences: { email: body.email, sms: body.sms, push: body.push } }, { status: 200 });
}
