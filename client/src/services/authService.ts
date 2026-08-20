// src/services/authService.ts
import { api, setAuthTokens, clearAuthTokens, getRefreshToken } from './api';
import { User } from '../types/user';
import { socketService } from './socketService';

export interface RegisterPayload {
  name: string;
  phone: string;
  password: string;
  email?: string;
  districtId?: string;
  districtName?: string;
  addressDetail?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function login(phone: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { phone, password });
  await setAuthTokens(data.accessToken, data.refreshToken);
  await socketService.connect();
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  await setAuthTokens(data.accessToken, data.refreshToken);
  await socketService.connect();
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } catch (err) {
    console.warn('Logout API error:', err);
  } finally {
    socketService.disconnect();
    await clearAuthTokens();
  }
}
