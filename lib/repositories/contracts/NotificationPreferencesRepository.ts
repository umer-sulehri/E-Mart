export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
}

export interface NotificationPreferencesRepository {
  get(userId: string): NotificationPreferences | Promise<NotificationPreferences>;
  update(userId: string, data: Partial<NotificationPreferences>): NotificationPreferences | Promise<NotificationPreferences>;
}
