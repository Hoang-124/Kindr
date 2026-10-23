// src/config/apiConfig.ts
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const CLOUD_BACKEND_HOST = 'https://kindr-backend-rl2t.onrender.com';

const getBaseHost = () => {
  if (process.env.EXPO_PUBLIC_API_HOST) {
    return process.env.EXPO_PUBLIC_API_HOST;
  }

  // Automatically detect LAN IP when running on a physical mobile device via Expo Go
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri && Platform.OS !== 'web') {
    const lanIp = hostUri.split(':')[0];
    if (lanIp && lanIp !== 'localhost' && lanIp !== '127.0.0.1') {
      return `http://${lanIp}:5000`;
    }
  }

  // Production / standalone APK or deployed web -> connect to shared Cloud Backend
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return CLOUD_BACKEND_HOST;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

export const API_HOST = getBaseHost();
export const API_BASE_URL = `${API_HOST}/api`;
export const SOCKET_URL = API_HOST;

export const USE_MOCK_DATA = false;
