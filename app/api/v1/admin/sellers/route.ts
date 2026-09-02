import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeOrTerm } from "@/lib/search-safe";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // all | pending | approved | rejected | suspended
    const search = searchParams.get("search") || "";

    let query = supabase
      .from("vendors")
      .select(
        "*, profiles(first_name, last_name, email, created_at), products(count)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      const escaped = safeOrTerm(search);
      query = query.or(`name.ilike.%${escaped}%,contact_email.ilike.%${escaped}%`);
    }

    const { data: vendors, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const normalized = (vendors || []).map((v) => ({
      id: v.id,
      user_id: v.user_id,
      name: v.name,
      slug: v.slug,
      description: v.description,
      logo_url: v.logo_url,
      contact_email: v.contact_email,
      contact_phone: v.contact_phone,
      status: v.status,
      rating: v.rating,
      total_sales: v.total_sales,
      commission_rate: v.commission_rate,
      created_at: v.created_at,
      owner_first_name: v.profiles?.first_name || "",
      owner_last_name: v.profiles?.last_name || "",
      owner_email: v.profiles?.email || "",
      owner_created_at: v.profiles?.created_at || null,
      productCount: Array.isArray(v.products) ? v.products.length : 0,
      products: undefined,
      profiles: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: normalized,
      meta: { totalItems: count || 0 },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
