// d:\Kindr\web\src\services\api.ts
import axios from 'axios';

const ACCESS_TOKEN_KEY = 'kindr_web_access_token';
const REFRESH_TOKEN_KEY = 'kindr_web_refresh_token';

const currentHostname =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';

const isLocalOrLanHost =
  currentHostname === 'localhost' ||
  currentHostname === '127.0.0.1' ||
  /^192\.168\.\d+\.\d+$/.test(currentHostname) ||
  /^10\.\d+\.\d+\.\d+$/.test(currentHostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(currentHostname);

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ||
  (isLocalOrLanHost
    ? `http://${currentHostname}:5000/api`
    : 'https://kindr-backend-rl2t.onrender.com/api');
export const SOCKET_BASE_URL =
  (import.meta as any).env?.VITE_SOCKET_URL ||
  (isLocalOrLanHost
    ? `http://${currentHostname}:5000`
    : 'https://kindr-backend-rl2t.onrender.com');

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url: string = originalRequest?.url || '';

    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    if (status === 401 && !originalRequest?._retry && !isAuthRoute) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data;
        setAuthTokens(newAccess, newRefresh);
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
