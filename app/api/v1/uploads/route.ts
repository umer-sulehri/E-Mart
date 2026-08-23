import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/auth/getSession';
import { isSupabaseConfigured } from '@/lib/supabase/optional';

const BUCKET = 'product-images';
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'seller' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data with a file field.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'A "file" field is required.' }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'Only JPEG, PNG or WebP images are allowed.' }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 2 MB or smaller.' }, { status: 413 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'File uploads require Supabase Storage. Paste an image URL instead in local mode.' },
      { status: 503 },
    );
  }

  try {
    // Storage writes are performed with the service-role client; the caller's
    // seller/admin role was already verified above.
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    const { data: existing } = await admin.storage.getBucket(BUCKET);
    if (!existing) {
      const { error: createError } = await admin.storage.createBucket(BUCKET, { public: true });
      if (createError && !/exists/i.test(createError.message)) throw createError;
    }

    const path = `${user.id}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
