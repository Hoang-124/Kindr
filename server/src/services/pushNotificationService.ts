// server/src/services/pushNotificationService.ts
import { User } from '../models/User';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushMessagePayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
}

/**
 * Validates if a string matches Expo push token format
 * e.g., ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx] or ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 */
export function isExpoPushToken(token: string): boolean {
  if (typeof token !== 'string') return false;
  return /^(ExponentPushToken|ExpoPushToken)\[.*\]$/.test(token) || token.startsWith('FCM:');
}

/**
 * Send push notification to specific tokens via Expo Push API
 */
export async function sendPushToTokens(
  tokens: string[],
  payload: PushMessagePayload
): Promise<{ success: boolean; sentCount: number; errors?: any[] }> {
  const validTokens = tokens.filter(isExpoPushToken);
  if (validTokens.length === 0) {
    return { success: true, sentCount: 0 };
  }

  // Construct messages for Expo Push API
  const messages = validTokens.map((token) => ({
    to: token,
    sound: payload.sound ?? 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
    badge: payload.badge,
    priority: 'high',
    channelId: 'default',
  }));

  // Batch in chunks of 100 (Expo maximum)
  const chunkSize = 100;
  const chunks = [];
  for (let i = 0; i < messages.length; i += chunkSize) {
    chunks.push(messages.slice(i, i + chunkSize));
  }

  let sentCount = 0;
  const errors: any[] = [];

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const resData = (await response.json()) as any;
      const tickets = resData?.data || [];

      tickets.forEach((ticket: any, idx: number) => {
        if (ticket.status === 'ok') {
          sentCount++;
        } else if (ticket.status === 'error') {
          errors.push(ticket);
          // If token is invalid/unregistered, clean it up
          if (ticket.details?.error === 'DeviceNotRegistered') {
            const deadToken = chunk[idx]?.to;
            if (deadToken) {
              cleanupDeadToken(deadToken).catch(() => {});
            }
          }
        }
      });
    } catch (err: any) {
      console.error('[PushService] Error posting to Expo Push API:', err.message);
      errors.push(err.message);
    }
  }

  return { success: errors.length === 0, sentCount, errors };
}

/**
 * Remove invalid token from all user records
 */
async function cleanupDeadToken(token: string): Promise<void> {
  try {
    await User.updateMany(
      { pushTokens: token },
      { $pull: { pushTokens: token } }
    );
    console.log(`[PushService] Cleaned up dead token: ${token}`);
  } catch (error) {
    console.error('[PushService] Failed to clean up dead token:', error);
  }
}

/**
 * Send push notification to a specific user by userId
 */
export async function sendPushToUser(
  userId: string | any,
  payload: PushMessagePayload
): Promise<boolean> {
  try {
    const user = await User.findById(userId).select('pushTokens name');
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      return false;
    }

    const result = await sendPushToTokens(user.pushTokens, payload);
    return result.sentCount > 0;
  } catch (error) {
    console.error('[PushService] sendPushToUser error:', error);
    return false;
  }
}

/**
 * Register push token for user
 */
export async function registerPushToken(userId: string, token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  try {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { pushTokens: token.trim() },
    });
    return true;
  } catch (error) {
    console.error('[PushService] registerPushToken error:', error);
    return false;
  }
}

/**
 * Unregister push token for user (e.g. on logout)
 */
export async function unregisterPushToken(userId: string, token: string): Promise<boolean> {
  if (!token) return false;
  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { pushTokens: token.trim() },
    });
    return true;
  } catch (error) {
    console.error('[PushService] unregisterPushToken error:', error);
    return false;
  }
}
