// server/src/config/env.ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kindr',
  JWT_SECRET: process.env.JWT_SECRET || 'kindr_dev_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'kindr_refresh_dev_secret',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:8081',
  NODE_ENV: process.env.NODE_ENV || 'development',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '616320462696-2gh4jaj1pafnatlujrqurv043cada6b8.apps.googleusercontent.com',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'kindr-media',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'kindr_secure_webhook_secret_2026',
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS || 'thienthien122004@gmail.com,admin@kindr.vn')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean),
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || process.env.EMAIL_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || process.env.EMAIL_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Kindr Support <support@kindr.vn>',
} as const;
