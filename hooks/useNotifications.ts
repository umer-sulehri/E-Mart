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

export interface FeedNotification {
  id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface FeedResponse {
  notifications: FeedNotification[];
  unreadCount: number;
}

const FEED_KEY = ['notifications'] as const;

export function useNotificationFeed(limit = 30, enabled = true) {
  return useQuery({
    queryKey: [...FEED_KEY, limit],
    queryFn: () => apiFetch<FeedResponse>(`/notifications?limit=${limit}`),
    enabled,
    refetchInterval: 60_000,
  });
}

function useInvalidateFeed() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: FEED_KEY });
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateFeed();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>('/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ id }),
      }),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateFeed();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean }>('/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ all: true }),
      }),
    onSuccess: invalidate,
  });
}
