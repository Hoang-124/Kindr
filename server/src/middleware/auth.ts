// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

/**
 * JWT Authentication Middleware.
 * Extracts and verifies JWT from Authorization header.
 * Sets req.userId and req.userRole on success.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Không có token xác thực. Vui lòng đăng nhập.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token đã hết hạn. Vui lòng refresh token.' });
      return;
    }
    res.status(401).json({ error: 'Token không hợp lệ.' });
  }
}

/**
 * Optional Auth — doesn't block, just attaches userId if token present.
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string; role: string };
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch {
      // Silently ignore invalid tokens for optional auth
    }
  }

  next();
}

/**
 * Admin-only guard. Must be used AFTER requireAuth.
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== 'admin') {
    res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập.' });
    return;
  }
  next();
}
