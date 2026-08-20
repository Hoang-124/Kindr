// src/types/notification.ts

export type NotificationType = 
  | 'match_request'
  | 'new_message'
  | 'safeful_time_started'
  | 'safeful_time_ending'
  | 'xu_released'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'post_approved'
  | 'welcome_credit';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedTransactionId?: string;
  relatedProductId?: string;
  createdAt: string;
}
