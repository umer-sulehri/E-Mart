import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set('session', '', { maxAge: 0, path: '/' });
  return response;
}
