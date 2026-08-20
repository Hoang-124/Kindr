// src/services/notifications/pushService.ts
import { Notification, NotificationType } from '../../types/notification';

/**
 * Service helper to generate and log in-app/push notification events
 */
class PushNotificationService {
  private listeners: Array<(notification: Notification) => void> = [];

  public subscribe(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  public async requestPermissions(): Promise<boolean> {
    // Permission simulator for Expo mobile environment
    console.log('[PushService] Requesting notification permissions...');
    return true;
  }

  public notifyUser(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    relatedTransactionId?: string,
    relatedProductId?: string
  ): Notification {
    const notification: Notification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      userId,
      type,
      title,
      body,
      isRead: false,
      relatedTransactionId,
      relatedProductId,
      createdAt: new Date().toISOString(),
    };

    console.log(`[PushService Notification Fired] (${type}) ${title}: ${body}`);
    this.listeners.forEach(listener => listener(notification));
    return notification;
  }
}

export const pushService = new PushNotificationService();
export default pushService;
