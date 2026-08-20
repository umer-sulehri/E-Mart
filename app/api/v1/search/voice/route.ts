import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.audioBase64 || typeof body.audioBase64 !== 'string') {
    return NextResponse.json({ error: 'audioBase64 is required' }, { status: 400 });
  }

  // Stub: return placeholder query
  return NextResponse.json({ query: 'placeholder query' }, { status: 200 });
}
