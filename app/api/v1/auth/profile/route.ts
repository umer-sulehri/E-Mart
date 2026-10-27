import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Session proven above; the row is keyed to that same user id. The
    // service-role client is needed because email/phone/date_of_birth are
    // outside the authenticated role's column grant.
    const { data: profile, error } = await createAdminClient()
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
        role: profile.role,
        isEmailVerified: profile.is_email_verified,
        profileImageUrl: profile.profile_image_url,
        dateOfBirth: profile.date_of_birth,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.firstName) updates.first_name = parsed.data.firstName;
    if (parsed.data.lastName) updates.last_name = parsed.data.lastName;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
    if (parsed.data.dateOfBirth !== undefined)
      updates.date_of_birth = parsed.data.dateOfBirth;
    if (parsed.data.profileImageUrl)
      updates.profile_image_url = parsed.data.profileImageUrl;

    updates.updated_at = new Date().toISOString();

    // The UPDATE itself stays on the user-scoped client so RLS (own row) and
    // the privilege-escalation trigger still see the real caller; only the
    // response re-read (which includes PII columns) uses the service role.
    // The updates object is built from the whitelist above, never from a
    // spread of the request body, so role/is_blocked cannot be injected.
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const { data: profile } = await createAdminClient()
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
        role: profile.role,
        isEmailVerified: profile.is_email_verified,
        profileImageUrl: profile.profile_image_url,
        dateOfBirth: profile.date_of_birth,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
