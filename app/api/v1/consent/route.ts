import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByIp, rateLimitHeaders } from "@/lib/rate-limit";

const CONSENT_TTL_MS = 13 * 30 * 24 * 60 * 60 * 1000;

interface ConsentRecord {
  subject: string;
  preferences: Record<string, boolean>;
  method: string | null;
  source: string;
  region: string;
  banner_version: string;
  privacy_policy_version: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

const ALLOWED_CATEGORIES = ["analytics", "marketing", "social"] as const;
const ALLOWED_METHODS = ["accept_all", "reject_all", "customize", "withdraw"] as const;
const ALLOWED_SOURCES = ["banner", "settings", "footer"] as const;

function defaultPreferences(): Record<string, boolean> {
  return { essential: true, analytics: false, marketing: false, social: false };
}

function normalizePreferences(input: unknown): Record<string, boolean> {
  const prefs = defaultPreferences();
  if (input && typeof input === "object") {
    for (const key of ALLOWED_CATEGORIES) {
      const value = (input as Record<string, unknown>)[key];
      prefs[key] = value === true;
    }
  }
  return prefs;
}

function normalizeMethod(input: unknown): string {
  return ALLOWED_METHODS.includes(input as never)
    ? (input as string)
    : "customize";
}

function normalizeSource(input: unknown): string {
  return ALLOWED_SOURCES.includes(input as never)
    ? (input as string)
    : "banner";
}

function regionOf(request: NextRequest): string {
  return (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    "unknown"
  );
}

function hashIp(request: NextRequest): string | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip");
  if (!ip) return null;
  const salt = process.env.SUPABASE_SECRET_KEY || "emart";
  const raw = `${ip}:${salt}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

async function getPrivacyVersions(): Promise<{ banner: string; policy: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["privacy_banner_version", "privacy_policy_version"]);

  const map: Record<string, string> = {};
  (data || []).forEach((s) => {
    map[s.key] = String(s.value ?? "");
  });

  return {
    banner: map["privacy_banner_version"] || "1",
    policy: map["privacy_policy_version"] || "2.0",
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const requestedSubject = searchParams.get("subject") || "";

    let subject: string | null = null;
    let row: ConsentRecord | null = null;

    if (user) {
      subject = `user:${user.id}`;
    } else if (
      typeof requestedSubject === "string" &&
      /^anon:[a-zA-Z0-9-]{8,64}$/.test(requestedSubject)
    ) {
      subject = requestedSubject;
    }

    if (subject) {
      const { data } = await supabase
        .from("user_consents")
        .select(
          "subject, preferences, method, source, region, banner_version, privacy_policy_version, expires_at, created_at, updated_at"
        )
        .eq("subject", subject)
        .maybeSingle();
      if (data) {
        row = data as unknown as ConsentRecord;
      }
    }

    const versions = await getPrivacyVersions();

    return NextResponse.json({
      success: true,
      data: {
        subject,
        region: regionOf(request),
        banner_version: versions.banner,
        privacy_policy_version: versions.policy,
        consent: row
          ? {
              preferences: row.preferences,
              method: row.method,
              source: row.source,
              region: row.region,
              banner_version: row.banner_version,
              privacy_policy_version: row.privacy_policy_version,
              expires_at: row.expires_at,
              created_at: row.created_at,
              updated_at: row.updated_at,
            }
          : null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const rate = await rateLimitByIp(request, 10, 60 * 1000);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(rate) }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const preferences = normalizePreferences(body?.preferences);
    const method = normalizeMethod(body?.method);
    const source = normalizeSource(body?.source);
    const region = regionOf(request);
    const versions = await getPrivacyVersions();
    const expiresAt = new Date(Date.now() + CONSENT_TTL_MS).toISOString();

    let subject: string;
    let useAdmin = false;

    if (user) {
      subject = `user:${user.id}`;
    } else {
      const anonKey = body?.subject;
      if (
        typeof anonKey !== "string" ||
        !/^anon:[a-zA-Z0-9-]{8,64}$/.test(anonKey)
      ) {
        return NextResponse.json(
          { success: false, error: "A valid anonymous subject is required" },
          { status: 400 }
        );
      }
      subject = anonKey;
      useAdmin = true;
    }

    const client = useAdmin ? createAdminClient() : supabase;

    const { data: existingRows } = await client
      .from("user_consents")
      .select("preferences, method, source")
      .eq("subject", subject);

    const previous = existingRows && existingRows.length > 0 ? existingRows[0] : null;

    const payload = {
      subject,
      user_id: user ? user.id : null,
      preferences,
      method,
      source,
      region,
      banner_version: versions.banner,
      privacy_policy_version: versions.policy,
      ip_hash: useAdmin ? hashIp(request) : null,
      user_agent: useAdmin ? (request.headers.get("user-agent") || "").slice(0, 300) : null,
      expires_at: expiresAt,
    };

    const { error } = await client.from("user_consents").upsert(payload, {
      onConflict: "subject",
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const { error: auditError } = await client.from("consent_audit").insert({
      subject: payload.subject,
      user_id: user ? user.id : null,
      action: "set",
      method,
      source,
      region,
      previous: previous ? previous.preferences : null,
      next: preferences,
    });

    if (auditError) {
      return NextResponse.json(
        { success: false, error: auditError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { subject: payload.subject, preferences, expires_at: expiresAt },
      meta: { remaining: rate.remaining },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const rate = await rateLimitByIp(request, 10, 60 * 1000);
  if (!rate.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rate) }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const source = normalizeSource(body?.source);
    const region = regionOf(request);

    let subject: string;
    let useAdmin = false;

    if (user) {
      subject = `user:${user.id}`;
    } else {
      const anonKey = body?.subject;
      if (
        typeof anonKey !== "string" ||
        !/^anon:[a-zA-Z0-9-]{8,64}$/.test(anonKey)
      ) {
        return NextResponse.json(
          { success: false, error: "A valid anonymous subject is required" },
          { status: 400 }
        );
      }
      subject = anonKey;
      useAdmin = true;
    }

    const client = useAdmin ? createAdminClient() : supabase;

    const { data: existingRows } = await client
      .from("user_consents")
      .select("preferences, method, source")
      .eq("subject", subject);

    const previous = existingRows && existingRows.length > 0 ? existingRows[0] : null;

    const prefs = defaultPreferences();

    const { error } = await client.from("user_consents").upsert(
      {
        subject,
        user_id: user ? user.id : null,
        preferences: prefs,
        method: "withdraw",
        source,
        region,
        banner_version: (await getPrivacyVersions()).banner,
        privacy_policy_version: (await getPrivacyVersions()).policy,
        ip_hash: useAdmin ? hashIp(request) : null,
        user_agent: useAdmin ? (request.headers.get("user-agent") || "").slice(0, 300) : null,
        expires_at: new Date(Date.now() + CONSENT_TTL_MS).toISOString(),
      },
      { onConflict: "subject" }
    );

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await client.from("consent_audit").insert({
      subject,
      user_id: user ? user.id : null,
      action: "withdraw",
      method: "withdraw",
      source,
      region,
      previous: previous ? previous.preferences : null,
      next: prefs,
    });

    return NextResponse.json({
      success: true,
      data: { subject, preferences: prefs },
      meta: { remaining: rate.remaining },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}