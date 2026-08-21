import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { clearSearchHistory } from '@/lib/search/searchService';

export async function DELETE() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await clearSearchHistory(user.id);
  return NextResponse.json({ success: true }, { status: 200 });
}
