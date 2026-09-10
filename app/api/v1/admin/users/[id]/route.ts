import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminLog } from "@/lib/audit";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 }) };
  }

  return { userId: user.id };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await verifyAdmin(supabase);
    if ("error" in auth) return auth.error;

    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await verifyAdmin(supabase);
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.role) updates.role = body.role;
    if (body.isBlocked !== undefined) updates.is_blocked = body.isBlocked;
    if (body.firstName) updates.first_name = body.firstName;
    if (body.lastName) updates.last_name = body.lastName;
    if (body.phone !== undefined) updates.phone = body.phone;

    // Profile updates on other users are admin-only, but the profiles table
    // has no admin UPDATE policy (RLS only allows `auth.uid() = id`), so
    // mutations run with the service-role client. The admin identity was
    // already verified at the top of this handler.
    const admin = createAdminClient();
    const { data: target } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();

    if (!target) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (id === auth.userId) {
      return NextResponse.json(
        { success: false, error: "You cannot change your own user record from this panel" },
        { status: 400 }
      );
    }

    if (target.role === "admin" && updates.role && updates.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Cannot change another admin's role" },
        { status: 400 }
      );
    }

    // Do not allow demoting or blocking the very last admin.
    if (updates.role && updates.role !== "admin") {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot demote the last remaining admin" },
          { status: 400 }
        );
      }
    }

    const { data: user, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await writeAdminLog(supabase, auth.userId, {
      action: "update_user",
      entityType: "user",
      entityId: id,
      details: { updates },
    });

    return NextResponse.json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const auth = await verifyAdmin(supabase);
    if ("error" in auth) return auth.error;

    if (id === auth.userId) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, email, first_name, last_name")
      .eq("id", id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (profile.role === "admin") {
      return NextResponse.json(
        { success: false, error: "Cannot delete admin users" },
        { status: 400 }
      );
    }

    // Admin-controlled mutations on profiles must use the service-role client:
    // the profiles table has no admin UPDATE/DELETE RLS policy.
    const admin = createAdminClient();

    // coupons.created_by references profiles(id) WITHOUT a delete action, so a
    // coupon this user created would block the auth.user deletion below.
    // Null it out first (idempotent).
    const { error: couponError } = await admin
      .from("coupons")
      .update({ created_by: null, updated_at: new Date().toISOString() })
      .eq("created_by", id);

    if (couponError) {
      return NextResponse.json(
        { success: false, error: couponError.message },
        { status: 500 }
      );
    }

    // Record the audit trail before removing the auth user. admin_logs.admin_id
    // references profiles with ON DELETE SET NULL, so the log survives.
    await writeAdminLog(supabase, auth.userId, {
      action: "delete_user",
      entityType: "user",
      entityId: id,
      details: { email: profile.email, name: `${profile.first_name} ${profile.last_name}` },
    });

    // Deleting the auth user cascades to profiles (ON DELETE CASCADE) and then
    // to all user-owned rows (wishlist, cart, reviews, addresses, etc.).
    const { error: deleteError } = await admin.auth.admin.deleteUser(id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
