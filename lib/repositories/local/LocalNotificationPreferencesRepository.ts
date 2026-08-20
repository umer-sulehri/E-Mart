import { NotificationPreferences, NotificationPreferencesRepository } from '../contracts/NotificationPreferencesRepository';

const store = new Map<string, NotificationPreferences>();

const defaultPrefs: Omit<NotificationPreferences, 'userId'> = {
  emailNotifications: true,
  pushNotifications: true,
  orderUpdates: true,
  promotions: false,
};

export class LocalNotificationPreferencesRepository implements NotificationPreferencesRepository {
  get(userId: string): NotificationPreferences {
    return store.get(userId) ?? { userId, ...defaultPrefs };
  }

  update(userId: string, data: Partial<NotificationPreferences>): NotificationPreferences {
    const existing = this.get(userId);
    const updated: NotificationPreferences = { ...existing, ...data, userId };
    store.set(userId, updated);
    return updated;
  }
}
