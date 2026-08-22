// server/src/__tests__/auth_google.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { ENV } from '../config/env';

const app = createApp();

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }
  await User.deleteMany({ email: { $in: ['test_google_mom@gmail.com', 'existing_google_mom@gmail.com'] } });
});

afterAll(async () => {
  const users = await User.find({ email: { $in: ['test_google_mom@gmail.com', 'existing_google_mom@gmail.com'] } });
  const userIds = users.map(u => u._id);
  await Notification.deleteMany({ userId: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  await mongoose.connection.close();
});

describe('🌐 Google OAuth Integration Test Suite', () => {
  const googleUserPayload = {
    googleId: 'google_test_sub_99887766',
    email: 'test_google_mom@gmail.com',
    name: 'Mẹ Bỉm Test Google',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
  };

  it('POST /api/auth/google → should register new user via Google and grant 10 Xu welcome credit', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send(googleUserPayload);

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('thành công');
    expect(res.body.isNewUser).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Mẹ Bỉm Test Google');
    expect(res.body.user.email).toBe('test_google_mom@gmail.com');
    expect(res.body.user.xuBalance).toBe(10);
    expect(res.body.user.civilizationPoints).toBe(95);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();

    // Verify Notification in DB
    const notif = await Notification.findOne({ userId: res.body.user._id, type: 'welcome_credit' });
    expect(notif).toBeDefined();
  });

  it('POST /api/auth/google → should login existing Google user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send(googleUserPayload);

    expect(res.status).toBe(200);
    expect(res.body.isNewUser).toBe(false);
    expect(res.body.user.email).toBe('test_google_mom@gmail.com');
    expect(res.body.accessToken).toBeDefined();
  });

  it('POST /api/auth/google → should reject empty/invalid payload with 400', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
