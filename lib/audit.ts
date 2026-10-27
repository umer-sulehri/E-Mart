import type { SupabaseClient } from '@supabase/supabase-js';

interface AuditLogInput {
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function writeAdminLog(
  supabase: SupabaseClient,
  adminId: string,
  input: AuditLogInput
): Promise<void> {
  try {
    // Supabase returns PostgREST failures in an `error` field rather than
    // throwing, so the result must be inspected — otherwise audit writes fail
    // silently and the trail has gaps.
    const { error } = await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      details: input.details ?? {},
    });

    if (error) {
      console.error(
        `[audit] Failed to write admin log (action=${input.action}, entity=${input.entityType ?? "-"}:${input.entityId ?? "-"}):`,
        error.message
      );
    }
  } catch (err) {
    // Audit logging is non-fatal — never let it break the primary operation.
    console.error('[audit] Unexpected error writing admin log:', err);
  }
}
