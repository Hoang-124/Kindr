import { Notification, NotificationType } from '../models/Notification';
import { User } from '../models/User';
import { emitToUser } from '../socket';
import { sendPushToUser } from './pushNotificationService';

export interface SendNotificationOptions {
  userId: any;
  type: NotificationType;
  title: string;
  body: string;
  relatedTransactionId?: any;
  relatedProductId?: any;
  data?: Record<string, any>;
}

/**
 * Send a notification to a single user, persisting in database and emitting via Socket.IO
 */
export async function sendNotification(options: SendNotificationOptions) {
  try {
    const notif = await Notification.create({
      userId: options.userId,
      type: options.type,
      title: options.title,
      body: options.body,
      relatedTransactionId: options.relatedTransactionId,
      relatedProductId: options.relatedProductId,
      data: options.data,
      isRead: false,
    });

    const targetUserId = options.userId.toString();
    const notifObj = notif.toObject ? notif.toObject() : notif;
    (notifObj as any).id = notif._id.toString();

    // Emit both events for seamless client compatibility
    emitToUser(targetUserId, 'notification_new', notifObj);
    emitToUser(targetUserId, 'notification', notifObj);

    // Also push notification via Expo Push API
    sendPushToUser(targetUserId, {
      title: options.title,
      body: options.body,
      data: {
        type: options.type,
        ...(options.data || {}),
        transactionId: options.relatedTransactionId?.toString(),
        productId: options.relatedProductId?.toString(),
      },
    }).catch(() => {});

    return notifObj;
  } catch (err) {
    console.error('Failed to send notification to user:', options.userId, err);
    return null;
  }
}

/**
 * Broadcast notification to all Admin users (e.g. when a new post is waiting for review)
 */
export async function notifyAdmins(options: Omit<SendNotificationOptions, 'userId'>) {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    const promises = admins.map(admin => 
      sendNotification({
        ...options,
        userId: admin._id,
      })
    );
    return await Promise.all(promises);
  } catch (err) {
    console.error('Failed to broadcast notification to admins:', err);
    return [];
  }
}
