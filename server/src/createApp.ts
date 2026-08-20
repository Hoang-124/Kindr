// server/src/createApp.ts
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import transactionRoutes from './routes/transactions';
import chatRoutes from './routes/chat';
import notificationRoutes from './routes/notifications';
import walletRoutes from './routes/wallet';
import ratingRoutes from './routes/ratings';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';

export function createApp(): Express {
  const app = express();

  // 1. Security & Body parsing
  app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  }));

  app.use(cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));

  // 2. Rate limiting for sensitive Auth routes
  if (process.env.NODE_ENV !== 'test') {
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Quá nhiều yêu cầu đăng nhập/đăng ký. Vui lòng thử lại sau 15 phút.' },
    });
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
  }

  // 3. Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Kindr API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // 4. Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/ratings', ratingRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);

  // 5. Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Lỗi hệ thống không xác định.' });
  });

  return app;
}
