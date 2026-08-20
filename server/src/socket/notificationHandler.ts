// server/src/socket/notificationHandler.ts
import { Server, Socket } from 'socket.io';
import { Notification } from '../models/Notification';

export function setupNotificationHandler(io: Server, socket: Socket, userId: string): void {
  /**
   * Client emits: 'mark_notification_read' { notificationId }
   */
  socket.on('mark_notification_read', async ({ notificationId }: { notificationId: string }) => {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true }
      );
    } catch (error) {
      console.error('mark_notification_read error:', error);
    }
  });

  /**
   * Client emits: 'mark_all_notifications_read'
   */
  socket.on('mark_all_notifications_read', async () => {
    try {
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
    } catch (error) {
      console.error('mark_all_notifications_read error:', error);
    }
  });
}
