// src/services/notificationService.ts
import { api } from './api';
import { Notification } from '../types/notification';

function normalizeNotification(raw: any): Notification {
  return {
    ...raw,
    id: raw.id || raw._id?.toString(),
    userId: raw.userId?._id?.toString() || raw.userId?.toString() || raw.userId,
    relatedTransactionId: raw.relatedTransactionId?._id?.toString() || raw.relatedTransactionId?.toString() || raw.relatedTransactionId,
    relatedProductId: raw.relatedProductId?._id?.toString() || raw.relatedProductId?.toString() || raw.relatedProductId,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export async function getNotifications(page = 1, limit = 20): Promise<{ notifications: Notification[]; pagination: any }> {
  const { data } = await api.get('/notifications', { params: { page, limit } });
  return {
    notifications: (data.notifications || []).map(normalizeNotification),
    pagination: data.pagination,
  };
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function markAsRead(id: string): Promise<void> {
  await api.put(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await api.put('/notifications/read-all');
}
