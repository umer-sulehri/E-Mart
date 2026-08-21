import { NextRequest } from 'next/server';
import { handleInitiate } from '@/lib/payments/initiateHandler';

export async function POST(request: NextRequest) {
  return handleInitiate(request, 'jazzcash');
}
