// server/src/config/env.ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/kindr',
  JWT_SECRET: process.env.JWT_SECRET || 'kindr_dev_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'kindr_refresh_dev_secret',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:8081',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;
