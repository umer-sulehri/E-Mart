import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Demo / tour-mode login. Clicking a role on the login page creates (on first
// use) a dedicated demo account for that role and signs it in, then redirects
// straight to the matching dashboard — no email/password or Google step.
//
// The endpoint is intentionally restricted to non-production environments
// unless NEXT_PUBLIC_ENABLE_DEMO_LOGIN is explicitly set to "true".
//
// Demo accounts:
//   buyer: demo.buyer@emart.com
//   seller: demo.seller@emart.com
//   admin: demo.admin@emart.com

const DEMO_PASSWORD = "Demo@2024!emart";

const ROLE_META: Record<
  string,
  { role: "customer" | "admin" | "seller"; email: string; firstName: string; lastName: string }
> = {
  buyer: { role: "customer", email: "demo.buyer@emart.com", firstName: "Demo", lastName: "Buyer" },
  seller: { role: "seller", email: "demo.seller@emart.com", firstName: "Demo", lastName: "Seller" },
  admin: { role: "admin", email: "demo.admin@emart.com", firstName: "Demo", lastName: "Admin" },
};

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

  let role = "buyer";
  try {
    const body = await request.json();
    role = body?.role;
  } catch {
    // default to buyer
  }

  const meta = ROLE_META[role];
  if (!meta) {
    return NextResponse.json(
      { success: false, error: "Invalid role for demo login." },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    // 1. Ensure the demo auth user exists (profile is auto-created by trigger).
    const { data: matched } = await admin
      .auth.admin
      .listUsers({ page: 1, perPage: 1000 });

    let userId: string | null = null;
    const existing = matched?.users?.find((u) => u.email?.toLowerCase() === meta.email);
    if (existing) {
      userId = existing.id;
      // Keep the stored password in sync in case the demo password ever changes.
      await admin.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD });
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: meta.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: meta.firstName,
          last_name: meta.lastName,
          role: meta.role,
        },
      });
      if (createError) {
        return NextResponse.json(
          { success: false, error: createError.message },
          { status: 500 }
        );
      }
      userId = created.user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Could not resolve the demo account." },
        { status: 500 }
      );
    }

    // 2. Ensure the profile row has the expected role (covers pre-existing users).
    const { data: profile } = await admin
      .from("profiles")
      .select("id, first_name, last_name, role")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      if (profile.role !== meta.role) {
        await admin.from("profiles").update({ role: meta.role }).eq("id", userId);
      }
    } else {
      await admin.from("profiles").insert({
        id: userId,
        email: meta.email,
        first_name: meta.firstName,
        last_name: meta.lastName,
        role: meta.role,
        is_email_verified: true,
      });
    }

    // 3. For the seller demo, ensure an approved vendor row exists so the
    //    seller dashboard has a store to render.
    if (meta.role === "seller") {
      const { data: vendor } = await admin
        .from("vendors")
        .select("id, status")
        .eq("user_id", userId)
        .maybeSingle();
      if (!vendor) {
        await admin.from("vendors").insert({
          user_id: userId,
          name: "Demo Store",
          slug: "demo-store",
          contact_email: meta.email,
          status: "approved",
          commission_rate: 10,
        });
      } else if (vendor.status === "rejected" || vendor.status === "suspended") {
        await admin.from("vendors").update({ status: "approved" }).eq("id", vendor.id);
      }
    }

    // 4. Sign in with a real session using the regular (anon) server client so
    //    the Supabase session cookies are persisted onto the response.
    const supabase = await createClient();
    const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
      email: meta.email,
      password: DEMO_PASSWORD,
    });

    if (signInError || !signIn.user) {
      return NextResponse.json(
        { success: false, error: signInError?.message ?? "Demo sign-in failed." },
        { status: 401 }
      );
    }

    const finalUser = {
      id: signIn.user.id,
      email: signIn.user.email,
      firstName: meta.firstName,
      lastName: meta.lastName,
      role: meta.role,
      isEmailVerified: true,
    };

    return NextResponse.json({ success: true, data: { user: finalUser } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Demo login failed. Please try again." },
      { status: 500 }
    );
  }
}
