import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { NotificationPreferences } from '@/lib/repositories/contracts/NotificationPreferencesRepository';

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: () => apiFetch<{ preferences: NotificationPreferences }>('/notifications/preferences'),
    select: (data) => data.preferences,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<NotificationPreferences, 'userId'>) =>
      apiFetch<{ preferences: NotificationPreferences }>('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] }),
  });
}
