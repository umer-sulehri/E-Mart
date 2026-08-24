/**
 * Creates or promotes a user to the admin role.
 *
 * Usage:
 *   node scripts/create-admin.mjs <email> <password> [name]
 *
 * Requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and
 * SUPABASE_SERVICE_ROLE_KEY in the environment / .env.local.
 * Run once per environment; safe to re-run (idempotent upsert).
 */
import { readFileSync, existsSync } from 'node:fs';

function loadEnvLocal() {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, raw] = match;
      if (!(key in process.env)) {
        process.env[key] = raw.replace(/^["']|["']$/g, '');
      }
    }
  }
}
loadEnvLocal();

const [email, password, name = 'Admin'] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> [name]');
  process.exit(1);
}

const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};

// 1. Create the auth user (or fetch the existing one).
let userId;
const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name } }),
});

if (createRes.ok) {
  const created = await createRes.json();
  userId = created.id;
  console.log(`Created auth user ${email} (${userId}).`);
} else {
  const error = await createRes.json().catch(() => ({}));
  const alreadyExists =
    createRes.status === 422 &&
    (error.msg?.includes('already been registered') || error.code === 'email_exists');
  if (!alreadyExists) {
    console.error('Failed to create auth user:', JSON.stringify(error));
    process.exit(1);
  }
  // The list endpoint does not filter by email server-side; match client-side.
  const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, { headers });
  if (!listRes.ok) {
    console.error('User exists but could not be looked up:', listRes.status);
    process.exit(1);
  }
  const list = await listRes.json();
  userId = (list.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
  if (!userId) {
    console.error('Existing user not found in listing.');
    process.exit(1);
  }
  // Keep the supplied password authoritative.
  await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ password, email_confirm: true }),
  });
  console.log(`Auth user ${email} already exists (${userId}); password reset to the supplied value.`);
}

// 2. Upsert the admin profile row. If the email is taken by a different
//    profile id, fall back to promoting whichever row owns the email.
const upsertRes = await fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
  method: 'POST',
  headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify({ id: userId, email, name, role: 'admin', status: 'active' }),
});

if (upsertRes.ok) {
  console.log(`Profile upserted: ${email} is now an admin.`);
  process.exit(0);
}

if (upsertRes.status !== 409) {
  console.error('Failed to upsert profile:', upsertRes.status, await upsertRes.text());
  process.exit(1);
}

const lookup = await fetch(
  `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`,
  { headers },
);
if (!lookup.ok) {
  console.error('Failed to look up existing profile:', lookup.status);
  process.exit(1);
}
const rows = await lookup.json();
if (!rows.length) {
  console.error('Email conflict reported but no matching profile found.');
  process.exit(1);
}
const patchRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${rows[0].id}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ role: 'admin', status: 'active', name }),
});
if (!patchRes.ok) {
  console.error('Failed to promote existing profile:', patchRes.status, await patchRes.text());
  process.exit(1);
}
console.log(`Existing profile ${rows[0].id} promoted: ${email} is now an admin.`);
