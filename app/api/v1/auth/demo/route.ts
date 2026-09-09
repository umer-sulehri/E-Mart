import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadSeedAccounts, type SeedAccount } from "@/lib/seed-accounts";

// Demo / tour-mode login. Supports two modes:
//
// 1. Legacy shorthand — POST { "role": "buyer" | "seller" | "admin" }
//    Picks the first account of that role from seed-accounts.json.
//
// 2. Specific account — POST { "email": "buyer.vip@emart.com" }
//    Creates & signs in that exact account.
//
// 3. Bulk seed — POST { "seedAll": true }
//    Creates every account in seed-accounts.json (admin-only in production).

const accounts = loadSeedAccounts();

// Build a lookup map: email → account
const emailMap = new Map(accounts.map((a) => [a.email.toLowerCase(), a]));

// Build role-based first-match map for shorthand mode
const roleFirst = {
  buyer: accounts.find((a) => a.role === "customer"),
  seller: accounts.find((a) => a.role === "seller"),
  admin: accounts.find((a) => a.role === "admin"),
};

async function ensureAuthUser(admin: ReturnType<typeof createAdminClient>, acct: SeedAccount) {
  // Check if user already exists
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === acct.email);

  let userId: string;

  if (existing) {
    userId = existing.id;
    // Keep password in sync
    await admin.auth.admin.updateUserById(existing.id, { password: acct.password });
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: acct.email,
      password: acct.password,
      email_confirm: true,
      user_metadata: {
        first_name: acct.firstName,
        last_name: acct.lastName,
        role: acct.role,
      },
    });
    if (error) throw new Error(error.message);
    userId = created.user!.id;
  }

  // Ensure profile row exists (trigger may have already created it)
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profile) {
    if (profile.role !== acct.role) {
      await admin.from("profiles").update({ role: acct.role }).eq("id", userId);
    }
  } else {
    await admin.from("profiles").insert({
      id: userId,
      email: acct.email,
      first_name: acct.firstName,
      last_name: acct.lastName,
      role: acct.role,
      is_email_verified: true,
    });
  }

  // For sellers, ensure a vendor row exists
  if (acct.role === "seller" && acct.vendorName) {
    const { data: vendor } = await admin
      .from("vendors")
      .select("id, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (!vendor) {
      await admin.from("vendors").insert({
        user_id: userId,
        name: acct.vendorName,
        slug: acct.vendorSlug,
        contact_email: acct.email,
        status: acct.vendorStatus ?? "approved",
        commission_rate: acct.commissionRate ?? 10,
      });
    } else {
      // Restore approved status unless it's a deliberately pending vendor
      const targetStatus = acct.vendorStatus ?? "approved";
      if (vendor.status !== targetStatus) {
        await admin.from("vendors").update({ status: targetStatus }).eq("id", vendor.id);
      }
    }
  }

  return userId;
}

async function signIn(supabase: Awaited<ReturnType<typeof createClient>>, acct: SeedAccount) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: acct.email,
    password: acct.password,
  });
  if (error || !data.user) throw new Error(error?.message ?? "Sign-in failed");
  return data.user;
}

export async function POST(request: NextRequest) {
  const demoEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";

  if (!demoEnabled) {
    return NextResponse.json(
      { success: false, error: "Demo login is not enabled on this environment." },
      { status: 403 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // empty body defaults to buyer shorthand
  }

  const admin = createAdminClient();

  // ── Mode 3: Bulk seed all accounts ──────────────────────────────────────
  if (body.seedAll === true) {
    if (accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: "Seed accounts are not configured on this environment (data/seed-accounts.json missing)." },
        { status: 503 }
      );
    }

    const results: { email: string; role: string; status: string; error?: string }[] = [];

    for (const acct of accounts) {
      try {
        await ensureAuthUser(admin, acct);
        results.push({ email: acct.email, role: acct.role, status: "created" });
      } catch (err) {
        results.push({
          email: acct.email,
          role: acct.role,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({ success: true, data: { total: accounts.length, results } });
  }

  // ── Mode 1 & 2: Single account sign-in ──────────────────────────────────
  let acct: SeedAccount | undefined;

  // Mode 2: specific email
  if (typeof body.email === "string") {
    acct = emailMap.get(body.email.toLowerCase());
    if (!acct) {
      return NextResponse.json(
        { success: false, error: `No seed account found for ${body.email}` },
        { status: 404 }
      );
    }
  }

  // Mode 1: role shorthand (buyer / seller / admin)
  if (!acct) {
    const roleKey = typeof body.role === "string" ? body.role.toLowerCase() : "buyer";
    if (roleKey in roleFirst) {
      acct = roleFirst[roleKey as keyof typeof roleFirst];
    }
    if (!acct) {
      return NextResponse.json(
        { success: false, error: "Invalid role or email. Pass { role: 'buyer'|'seller'|'admin' } or { email: '...' }." },
        { status: 400 }
      );
    }
  }

  try {
    await ensureAuthUser(admin, acct);

    const supabase = await createClient();
    const user = await signIn(supabase, acct);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: acct.firstName,
          lastName: acct.lastName,
          role: acct.role,
          isEmailVerified: true,
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Demo sign-in failed." },
      { status: 500 }
    );
  }
}
