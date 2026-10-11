// server/tests/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure-for-kindr-test-123456';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-very-long-and-secure-1234567890';
  process.env.WEBHOOK_SECRET = 'test-webhook-secret-999';
  process.env.ENABLE_DEMO_TOPUP = 'true';
  process.env.ENABLE_DEMO_LOGIN = 'true';

  let uri = '';
  try {
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
  } catch (err) {
    console.warn('[TestSetup] MongoMemoryServer unavailable, falling back to local MongoDB test db:', err);
    uri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/kindr_test';
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
