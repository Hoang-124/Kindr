// server/src/utils/cors.ts
import { ENV } from '../config/env';

/**
 * Validates whether an incoming HTTP or WebSocket origin is permitted.
 */
export function isOriginAllowed(origin?: string): boolean {
  // Mobile apps, native webviews, curl, or server-to-server requests have no origin header
  if (!origin) return true;

  const allowedOrigins = [
    ENV.CLIENT_URL,
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  if (
    allowedOrigins.includes(origin) ||
    origin.endsWith('.vercel.app') ||
    origin.endsWith('.onrender.com') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  ) {
    return true;
  }

  if (ENV.NODE_ENV !== 'production') {
    return true;
  }

  return false;
}
