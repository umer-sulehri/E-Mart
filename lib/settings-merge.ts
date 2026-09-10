import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_ATTEMPTS = 5;

export type BlobMutation =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; notFound: boolean };

export type MergeOutcome =
  | { ok: true; saved: Record<string, unknown> }
  | { ok: false; error: { message: string; status: number } };

export async function mutateSettingBlob(
  supabase: SupabaseClient,
  key: string,
  mutate: (current: Record<string, unknown>) => BlobMutation
): Promise<MergeOutcome> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { data: existing } = await supabase
      .from("settings")
      .select("value, updated_at")
      .eq("key", key)
      .single();

    const current =
      ((existing?.value as Record<string, unknown> | undefined) ?? {}) as Record<
        string,
        unknown
      >;

    const result = mutate(current);
    if (!result.ok) {
      return { ok: false, error: { message: "Settings not found", status: 404 } };
    }

    if (existing) {
      const { data, error } = await supabase
        .from("settings")
        .update({ value: result.value })
        .eq("key", key)
        .eq("updated_at", existing.updated_at)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") continue;
        return { ok: false, error: { message: error.message, status: 500 } };
      }
      return { ok: true, saved: data };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("settings")
      .upsert({ key, value: result.value }, { onConflict: "key", ignoreDuplicates: true })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "PGRST116") continue;
      return { ok: false, error: { message: insertError.message, status: 500 } };
    }
    return { ok: true, saved: inserted };
  }

  return {
    ok: false,
    error: { message: "Too many concurrent modifications, try again", status: 409 },
  };
}