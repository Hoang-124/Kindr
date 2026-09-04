// client/src/services/pushNotificationClient.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from './api';

const PUSH_TOKEN_STORAGE_KEY = '@kindr_expo_push_token';

let cachedPushToken: string | null = null;

// Configure global foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register device with backend to receive push notifications via Expo Push Service
 */
export async function registerPushNotifications(): Promise<string | null> {
  try {
    // 1. Web fallback
    if (Platform.OS === 'web') {
      console.log('[Push] Push notifications via Expo Push Service are designed for mobile devices.');
      return null;
    }

    // 2. Simulator handling
    if (!Device.isDevice) {
      console.log('[Push] Running on simulator/emulator - using simulated device token for development.');
      const mockToken = `ExponentPushToken[SIMULATOR_${Platform.OS.toUpperCase()}_DEV]`;
      try {
        await api.post('/auth/push-token', { token: mockToken });
        cachedPushToken = mockToken;
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, mockToken);
      } catch (err: any) {
        console.warn('[Push] Simulator token registration fallback:', err.message);
      }
      return mockToken;
    }

    // 3. Request permissions on physical device
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push] Notification permissions not granted by user.');
      return null;
    }

    // 4. Android specific notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Thông báo Kindr',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#059669',
      });
    }

    // 5. Get Expo Push Token
    const pushTokenData = await Notifications.getExpoPushTokenAsync();
    const token = pushTokenData.data;

    if (!token) {
      console.warn('[Push] Failed to acquire Expo push token.');
      return null;
    }

    // 6. Send token to Kindr Backend
    await api.post('/auth/push-token', { token });
    cachedPushToken = token;
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);

    console.log('[Push] Registered Expo Push Token successfully:', token);
    return token;
  } catch (error: any) {
    console.error('[Push] Failed to register push token:', error.message);
    return null;
  }
}

/**
 * Unregister push token on logout
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const token = cachedPushToken || (await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY));
    if (token) {
      await api.delete('/auth/push-token', { data: { token } });
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
      cachedPushToken = null;
      console.log('[Push] Unregistered push token from server.');
    }
  } catch (error: any) {
    console.warn('[Push] Failed to unregister push token:', error.message);
  }
}

/**
 * Hook to listen for notification responses (e.g. user taps on notification banner)
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[Push] Notification received in foreground:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[Push] User tapped notification:', response);
    if (onNotificationResponse) {
      onNotificationResponse(response);
    }
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
