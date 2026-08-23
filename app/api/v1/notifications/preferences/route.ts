import { NextRequest, NextResponse } from 'next/server';
import { NotificationPreferencesRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const preferences = await NotificationPreferencesRepository.get(user.id);
    return NextResponse.json({ preferences }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to load notification preferences' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (
    typeof body?.emailNotifications !== 'boolean' ||
    typeof body?.pushNotifications !== 'boolean' ||
    typeof body?.orderUpdates !== 'boolean' ||
    typeof body?.promotions !== 'boolean'
  ) {
    return NextResponse.json(
      { error: 'emailNotifications, pushNotifications, orderUpdates, and promotions must be booleans' },
      { status: 400 }
    );
  }

  try {
    const preferences = await NotificationPreferencesRepository.update(user.id, {
      emailNotifications: body.emailNotifications,
      pushNotifications: body.pushNotifications,
      orderUpdates: body.orderUpdates,
      promotions: body.promotions,
    });
    return NextResponse.json({ preferences }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to save notification preferences' }, { status: 500 });
  }
}
