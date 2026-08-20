// src/config/apiConfig.ts
import { Platform } from 'react-native';

// For local Android emulator, use 10.0.2.2; for iOS/Web/Physical devices, use localhost or LAN IP
const getBaseHost = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

export const API_HOST = getBaseHost();
export const API_BASE_URL = `${API_HOST}/api`;
export const SOCKET_URL = API_HOST;

export const USE_MOCK_DATA = false;
