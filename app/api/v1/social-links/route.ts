import { NextResponse } from 'next/server';
import { SocialLinkRepository } from '@/lib/repositories/index';

export async function GET() {
  const links = await SocialLinkRepository.findActive();
  return NextResponse.json(links, { status: 200 });
}
