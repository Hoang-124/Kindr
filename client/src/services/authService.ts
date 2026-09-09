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

export interface RegisterResponse {
  message: string;
  needsActivation?: boolean;
  email?: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

export async function login(phone: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { phone, password });
  await setAuthTokens(data.accessToken, data.refreshToken);
  await socketService.connect();
  return data;
}

export async function loginGoogle(googleData: { credential?: string; idToken?: string; email?: string; name?: string; avatar?: string; googleId?: string }): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/google', googleData);
  await setAuthTokens(data.accessToken, data.refreshToken);
  await socketService.connect();
  return data;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', payload);
  if (data.accessToken && data.refreshToken) {
    await setAuthTokens(data.accessToken, data.refreshToken);
    await socketService.connect();
  }
  return data;
}

export async function activateAccount(email: string, otp: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/activate-account', { email, otp });
  if (data.accessToken && data.refreshToken) {
    await setAuthTokens(data.accessToken, data.refreshToken);
    await socketService.connect();
  }
  return data;
}

export async function resendActivation(email: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/auth/resend-activation', { email });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}

export async function updateProfile(payload: {
  name?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  districtId?: string;
  districtName?: string;
  addressDetail?: string;
}): Promise<{ message: string; user: User }> {
  const { data } = await api.put<{ message: string; user: User }>('/auth/profile', payload);
  return data;
}

export async function changePassword(payload: { oldPassword?: string; newPassword: string }): Promise<{ message: string }> {
  const { data } = await api.put<{ message: string }>('/auth/change-password', payload);
  return data;
}

export async function sendForgotPasswordOtp(email: string): Promise<{ message: string; email?: string; otpDev?: string }> {
  const { data } = await api.post<{ message: string; email?: string; otpDev?: string }>('/auth/forgot-password', { email });
  return data;
}

export async function verifyOtp(email: string, otp: string): Promise<{ valid: boolean; message: string }> {
  const { data } = await api.post<{ valid: boolean; message: string }>('/auth/verify-otp', { email, otp });
  return data;
}

export async function resetPasswordWithOtp(payload: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', payload);
  return data;
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
