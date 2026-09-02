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
    await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      details: input.details ?? {},
    });
  } catch {
    // Audit logging is non-fatal — never let it break the primary operation.
  }
}
