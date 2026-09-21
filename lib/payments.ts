import type { SupabaseClient } from "@supabase/supabase-js";

const TOGGLES = [
  "stripe_enabled",
  "easypaisa_enabled",
  "jazzcash_enabled",
  "cod_enabled",
] as const;

export type PaymentToggle = (typeof TOGGLES)[number];

export type PaymentToggleState = Record<PaymentToggle, boolean>;

/**
 * Resolve which payment gateways are enabled for checkout.
 *
 * The admin settings UI persists toggles as `payments.<key>` rows
 * (`payments.easypaisa_enabled`, etc.), while a few databases still carry the
 * legacy top-level keys. Prefer the prefixed row, fall back to the top-level
 * row, and default to **enabled** when neither exists so a freshly seeded
 * database keeps offering every method until an admin explicitly disables one.
 */
export async function getPaymentToggleState(
  supabase: SupabaseClient
): Promise<PaymentToggleState> {
  const keys = [
    ...TOGGLES,
    ...TOGGLES.map((toggle) => `payments.${toggle}`),
  ];

  const { data: rows, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", keys);

  if (error) {
    throw new Error(error.message);
  }

  const record: Record<string, unknown> = {};
  (rows || []).forEach((row) => {
    record[row.key] = row.value;
  });

  const state = {} as PaymentToggleState;
  for (const toggle of TOGGLES) {
    const raw = record[`payments.${toggle}`] ?? record[toggle] ?? true;
    state[toggle] = String(raw).trim().toLowerCase() !== "false";
  }
  return state;
}

/**
 * Map a client/DB payment method to the toggle that gates it. Returns null for
 * methods the platform does not manage.
 */
export function paymentMethodToToggle(
  method: string
): PaymentToggle | null {
  const m = String(method || "").toLowerCase();
  if (m === "easypaisa") return "easypaisa_enabled";
  if (m === "jazzcash") return "jazzcash_enabled";
  if (["stripe", "card", "credit_card", "debit_card", "paypal"].includes(m)) {
    return "stripe_enabled";
  }
  if (["cod", "cash_on_delivery", "bank_transfer"].includes(m)) {
    return "cod_enabled";
  }
  return null;
}

/** Human-readable label for each checkout method id used by the client. */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
  card: "Credit / Debit Card",
  cod: "Cash on Delivery",
};