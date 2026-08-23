import { NextRequest, NextResponse } from 'next/server';
import { ReviewRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const rating = body?.rating;
  const comment = body?.comment;

  if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
  }
  if (comment !== undefined && (typeof comment !== 'string' || !comment.trim())) {
    return NextResponse.json({ error: 'comment cannot be empty' }, { status: 400 });
  }
  if (rating === undefined && comment === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  try {
    const review = await ReviewRepository.update(
      id,
      user.id,
      {
        ...(rating !== undefined ? { rating } : {}),
        ...(comment !== undefined ? { comment: comment.trim() } : {}),
      }
    );
    if (!review) {
      return NextResponse.json({ error: 'Review not found or not yours to edit' }, { status: 404 });
    }
    return NextResponse.json({ review }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
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

  // Ownership check before delete — users may only remove their own review.
  const ownReviews = await ReviewRepository.findByUser(user.id);
  if (!ownReviews.some((r) => r.id === id)) {
    return NextResponse.json({ error: 'Review not found or not yours to delete' }, { status: 404 });
  }

  try {
    await ReviewRepository.delete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
