// server/src/__tests__/push_notifications.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { ENV } from '../config/env';
import {
  isExpoPushToken,
  registerPushToken,
  unregisterPushToken,
  sendPushToUser,
} from '../services/pushNotificationService';

const app = createApp();
let testUser: any;
let authToken = '';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  testUser = await User.create({
    name: 'Mẹ Test Push Notif',
    phone: '0977665544',
    passwordHash,
    xuBalance: 10,
    pushTokens: [],
  });

  authToken = jwt.sign({ userId: testUser._id.toString(), role: 'user' }, ENV.JWT_SECRET);
});

afterAll(async () => {
  await User.deleteMany({ phone: '0977665544' });
  await mongoose.connection.close();
});

describe('📲 Push Notification System Tests', () => {
  const sampleExpoToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
  const sampleExpoToken2 = 'ExpoPushToken[yyyyyyyyyyyyyyyyyyyyyy]';

  it('1. isExpoPushToken → should correctly validate Expo tokens', () => {
    expect(isExpoPushToken(sampleExpoToken)).toBe(true);
    expect(isExpoPushToken(sampleExpoToken2)).toBe(true);
    expect(isExpoPushToken('FCM:some_fcm_token_123')).toBe(true);
    expect(isExpoPushToken('invalid_random_token')).toBe(false);
    expect(isExpoPushToken('')).toBe(false);
  });

  it('2. POST /api/auth/push-token → should register token into user profile', async () => {
    const res = await request(app)
      .post('/api/auth/push-token')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ token: sampleExpoToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('thành công');

    const updated = await User.findById(testUser._id);
    expect(updated?.pushTokens).toContain(sampleExpoToken);
  });

  it('3. POST /api/auth/push-token → should deduplicate tokens (no duplicates)', async () => {
    // Register the same token again
    await request(app)
      .post('/api/auth/push-token')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ token: sampleExpoToken });

    const updated = await User.findById(testUser._id);
    const count = updated?.pushTokens.filter((t) => t === sampleExpoToken).length;
    expect(count).toBe(1);
  });

  it('4. registerPushToken service directly adds multiple unique tokens', async () => {
    await registerPushToken(testUser._id.toString(), sampleExpoToken2);
    const updated = await User.findById(testUser._id);
    expect(updated?.pushTokens).toContain(sampleExpoToken);
    expect(updated?.pushTokens).toContain(sampleExpoToken2);
  });

  it('5. DELETE /api/auth/push-token → should unregister token on logout', async () => {
    const res = await request(app)
      .delete('/api/auth/push-token')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ token: sampleExpoToken });

    expect(res.status).toBe(200);

    const updated = await User.findById(testUser._id);
    expect(updated?.pushTokens).not.toContain(sampleExpoToken);
    expect(updated?.pushTokens).toContain(sampleExpoToken2);
  });

  it('6. unregisterPushToken service directly removes token', async () => {
    await unregisterPushToken(testUser._id.toString(), sampleExpoToken2);
    const updated = await User.findById(testUser._id);
    expect(updated?.pushTokens).not.toContain(sampleExpoToken2);
    expect(updated?.pushTokens?.length).toBe(0);
  });

  it('7. sendPushToUser → should return false gracefully if user has no registered tokens', async () => {
    const sent = await sendPushToUser(testUser._id, {
      title: 'Chào mừng!',
      body: 'Bạn có thông báo mới.',
    });
    expect(sent).toBe(false);
  });
});
