import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadSeedAccounts, type SeedAccount } from "@/lib/seed-accounts";

// POST /api/v1/auth/demo/seed-all
// Bulk-creates all seed accounts in Supabase Auth + profiles + vendor rows.
// Restricted to non-production unless NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true.
//
// Usage:
//   curl -X POST http://localhost:3000/api/v1/auth/demo/seed-all \
//     -H "Content-Type: application/json"

const accounts = loadSeedAccounts();

interface SeedResult {
  email: string;
  role: string;
  status: "created" | "exists" | "error";
  error?: string;
}

export async function POST(_request: NextRequest) {
  const demoEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";

  if (!demoEnabled) {
    return NextResponse.json(
      { success: false, error: "Seed is not enabled on this environment." },
      { status: 403 }
    );
  }

  if (accounts.length === 0) {
    return NextResponse.json(
      { success: false, error: "Seed accounts are not configured on this environment (data/seed-accounts.json missing)." },
      { status: 503 }
    );
  }

  const admin = createAdminClient();
  const results: SeedResult[] = [];

  // Fetch all existing users once to avoid N+1 queries
  const { data: existingUsers } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const userMap = new Map(
    (existingUsers?.users ?? []).map((u) => [u.email?.toLowerCase(), u])
  );

  for (const acct of accounts) {
    try {
      const existing = userMap.get(acct.email.toLowerCase());

      if (existing) {
        // Update password to keep in sync
        await admin.auth.admin.updateUserById(existing.id, {
          password: acct.password,
        });

        // Ensure profile has correct role
        await admin
          .from("profiles")
          .update({ role: acct.role, is_email_verified: true })
          .eq("id", existing.id);

        // Ensure vendor row for sellers
        if (acct.role === "seller" && acct.vendorName) {
          const { data: vendor } = await admin
            .from("vendors")
            .select("id, status")
            .eq("user_id", existing.id)
            .maybeSingle();

          if (!vendor) {
            await admin.from("vendors").insert({
              user_id: existing.id,
              name: acct.vendorName,
              slug: acct.vendorSlug,
              contact_email: acct.email,
              status: acct.vendorStatus ?? "approved",
              commission_rate: acct.commissionRate ?? 10,
            });
          }
        }

        results.push({ email: acct.email, role: acct.role, status: "exists" });
        continue;
      }

      // Create auth user
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email: acct.email,
          password: acct.password,
          email_confirm: true,
          user_metadata: {
            first_name: acct.firstName,
            last_name: acct.lastName,
            role: acct.role,
          },
        });

      if (createError) throw new Error(createError.message);
      const userId = created.user!.id;

      // Profile is auto-created by the DB trigger, but ensure role is set
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) {
        await admin.from("profiles").insert({
          id: userId,
          email: acct.email,
          first_name: acct.firstName,
          last_name: acct.lastName,
          role: acct.role,
          is_email_verified: true,
        });
      } else {
        await admin
          .from("profiles")
          .update({ role: acct.role, is_email_verified: true })
          .eq("id", userId);
      }

      // Create vendor row for sellers
      if (acct.role === "seller" && acct.vendorName) {
        await admin.from("vendors").insert({
          user_id: userId,
          name: acct.vendorName,
          slug: acct.vendorSlug,
          contact_email: acct.email,
          status: acct.vendorStatus ?? "approved",
          commission_rate: acct.commissionRate ?? 10,
        });
      }

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

  const created = results.filter((r) => r.status === "created").length;
  const existed = results.filter((r) => r.status === "exists").length;
  const failed = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    success: failed === 0,
    data: {
      total: accounts.length,
      created,
      existed,
      failed,
      results,
    },
  });
}
