import { NotificationPreferences, NotificationPreferencesRepository } from '../contracts/NotificationPreferencesRepository';
import { createClient } from '@/lib/supabase/server';

const defaultPrefs: Omit<NotificationPreferences, 'userId'> = {
  emailNotifications: true,
  pushNotifications: true,
  orderUpdates: true,
  promotions: false,
};

function mapRow(row: Record<string, unknown>): NotificationPreferences {
  return {
    userId: row.user_id as string,
    emailNotifications: (row.email_notifications as boolean) ?? true,
    pushNotifications: (row.push_notifications as boolean) ?? true,
    orderUpdates: (row.order_updates as boolean) ?? true,
    promotions: (row.promotions as boolean) ?? false,
  };
}

export class SupabaseNotificationPreferencesRepository implements NotificationPreferencesRepository {
  async get(userId: string): Promise<NotificationPreferences> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { userId, ...defaultPrefs };
    return mapRow(data);
  }

  async update(userId: string, data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: userId,
          ...(data.emailNotifications !== undefined && { email_notifications: data.emailNotifications }),
          ...(data.pushNotifications !== undefined && { push_notifications: data.pushNotifications }),
          ...(data.orderUpdates !== undefined && { order_updates: data.orderUpdates }),
          ...(data.promotions !== undefined && { promotions: data.promotions }),
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();
    if (error) throw error;
    return mapRow(row);
  }
}
