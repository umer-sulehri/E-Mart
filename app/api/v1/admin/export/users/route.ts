import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv, downloadCsvResponse } from "@/lib/csv";
import { rateLimitByIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const limit = rateLimitByIp(request, 30, 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { data: users, error } = await supabase
      .from("profiles")
      .select("email, first_name, last_name, phone, role, is_blocked, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = (users || []).map((u) => ({
      Email: u.email,
      First_Name: u.first_name,
      Last_Name: u.last_name,
      Phone: u.phone ?? "",
      Role: u.role,
      Blocked: u.is_blocked ? "Yes" : "No",
      Registered: u.created_at,
    }));

    return downloadCsvResponse(toCsv(rows), `users-${Date.now()}.csv`);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
