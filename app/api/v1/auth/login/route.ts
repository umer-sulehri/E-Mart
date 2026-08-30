import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, role } = parsed.data;
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    // Role scoping: if a role was selected on the login screen, require the
    // account's actual role to match. This prevents an admin/seller from
    // signing into the buyer flow (and vice-versa) with the wrong button.
    if (role && profile?.role && role !== profile.role) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          success: false,
          error: `This account is registered as ${
            profile.role === "customer" ? "a buyer" : `an ${profile.role}`
          }. Please use the correct login option.`,
        },
        { status: 403 }
      );
    }

    // Seller status check: a seller whose store was suspended or rejected must
    // not be able to access the seller dashboard.
    if (profile?.role === "seller") {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("status")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (vendor && (vendor.status === "suspended" || vendor.status === "rejected")) {
        await supabase.auth.signOut();
        return NextResponse.json(
          {
            success: false,
            error:
              vendor.status === "suspended"
                ? "Your seller account has been suspended. Contact support."
                : "Your seller application was not approved. Contact support.",
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: profile?.first_name,
          lastName: profile?.last_name,
          role: profile?.role,
          profileImageUrl: profile?.profile_image_url,
        },
        session: data.session,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
