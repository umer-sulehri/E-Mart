import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePagination, buildPaginationMeta } from "@/lib/pagination";
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
    const status = searchParams.get("status"); // open | resolved | all
    const search = (searchParams.get("search") || "").trim();
    const { page, limit, offset } = parsePagination(searchParams);

    let query = supabase
      .from("contact_submissions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      // created_at is not unique — two submissions in the same millisecond would
      // otherwise be free to swap between requests, landing on two pages at once.
      .order("id", { ascending: false });

    if (status === "resolved") query = query.eq("is_resolved", true);
    else if (status === "open") query = query.eq("is_resolved", false);

    // Searched server-side, not in the browser: filtering the current page only
    // would silently hide matches living on pages the admin never visits.
    if (search) {
      query = query.or(
        `name.ilike.%${safeOrTerm(search)}%,` +
          `email.ilike.%${safeOrTerm(search)}%,` +
          `subject.ilike.%${safeOrTerm(search)}%`
      );
    }

    // Ranged after the filters, so `count` describes the filtered set.
    query = query.range(offset, offset + limit - 1);

    const { data: submissions, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // The tab badges and the Open/Resolved stat cards need counts across the
    // whole table. Deriving them from `submissions` would only ever describe the
    // current page, which looks authoritative while being wrong. head:true
    // fetches no rows, so these two are index-only counts.
    const [openRes, resolvedRes] = await Promise.all([
      supabase
        .from("contact_submissions")
        .select("id", { count: "exact", head: true })
        .eq("is_resolved", false),
      supabase
        .from("contact_submissions")
        .select("id", { count: "exact", head: true })
        .eq("is_resolved", true),
    ]);

    const open = openRes.count ?? 0;
    const resolved = resolvedRes.count ?? 0;

    return NextResponse.json({
      success: true,
      data: submissions || [],
      meta: buildPaginationMeta(page, limit, count || 0),
      counts: { all: open + resolved, open, resolved },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
