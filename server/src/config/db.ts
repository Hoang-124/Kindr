// server/src/config/db.ts
import mongoose from 'mongoose';
import { ENV } from './env';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting reconnect...');
  });
}
