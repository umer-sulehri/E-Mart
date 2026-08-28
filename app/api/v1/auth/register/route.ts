import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, role, storeName } = parsed.data;
    const supabase = await createClient();

    // Only allow self-service roles; admin is provisioned by an administrator.
    if (role !== "customer" && role !== "seller") {
      return NextResponse.json(
        { success: false, error: "Invalid role for self-registration" },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { firstName, lastName, role },
      },
    });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: "Registration failed" },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      is_email_verified: false,
    });

    if (profileError) {
      return NextResponse.json(
        { success: false, error: "Failed to create profile" },
        { status: 500 }
      );
    }

    // Seller registration: create the vendors record (status pending) so the
    // seller has a store to onboard. Admin verifies/approves it later.
    if (role === "seller") {
      const requestedName =
        (storeName && storeName.trim()) ||
        `${firstName} ${lastName}`.trim() ||
        "My Store";
      let slug = slugify(requestedName) || "store";
      const baseSlug = slug;
      let counter = 1;
      while (true) {
        const { data: existing } = await supabase
          .from("vendors")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const displayName =
        (storeName && storeName.trim()) || `${firstName} ${lastName}`.trim();

      const { error: vendorError } = await supabase.from("vendors").insert({
        user_id: authData.user.id,
        name: displayName,
        slug,
        contact_email: email,
        status: "pending",
      });

      if (vendorError) {
        return NextResponse.json(
          { success: false, error: "Failed to create seller store" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            firstName,
            lastName,
            role,
          },
          session: authData.session,
        },
        message: "Registration successful",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
