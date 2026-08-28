import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validators";

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

    const { email, password, firstName, lastName, role } = parsed.data;
    const supabase = await createClient();

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
