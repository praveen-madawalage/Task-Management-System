import { api } from './axiosClient';
import type { AppNotification } from '../types';

export interface NotificationListResult {
  notifications: AppNotification[];
  unreadCount: number;
}

export const listNotifications = (unreadOnly = false) =>
  api
    .get<NotificationListResult>('/api/notifications', {
      params: unreadOnly ? { unreadOnly: 'true' } : {},
    })
    .then((r) => r.data);

export const markRead = (id: string) =>
  api.patch<{ notification: AppNotification }>(`/api/notifications/${id}/read`).then((r) => r.data.notification);

export const markAllRead = () =>
  api.patch<{ message: string }>('/api/notifications/read-all').then((r) => r.data);
