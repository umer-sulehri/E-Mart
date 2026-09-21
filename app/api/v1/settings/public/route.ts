import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPaymentToggleState } from "@/lib/payments";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: settings, error } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "site_name",
        "site_description",
        "site_logo",
        "contact_email",
        "contact_phone",
        "contact_address",
        "social_facebook",
        "social_twitter",
        "social_instagram",
        "free_shipping_threshold",
        "standard_shipping_cost",
        "express_shipping_cost",
        "tax_rate",
        "currency",
        "maintenance_mode",
        "announcement_text",
      ]);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const publicSettings: Record<string, string> = {};
    (settings || []).forEach((s) => {
      publicSettings[s.key] = s.value;
    });

    // Payment gateways are toggled in the admin "Payments" tab; expose the
    // resolved on/off flags so any client (checkout, cart) can hide methods
    // the store owner disabled. Missing rows default to enabled.
    const payments = await getPaymentToggleState(supabase);

    return NextResponse.json({
      success: true,
      data: {
        ...publicSettings,
        // Nested, grouped shape for new consumers…
        payments,
        // …plus flat booleans so older flat lookups keep working.
        ...payments,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}