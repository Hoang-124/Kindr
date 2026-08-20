// server/src/__tests__/auth.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { ENV } from '../config/env';

const app = createApp();

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }
});

afterAll(async () => {
  // Cleanup test users
  await User.deleteMany({ phone: { $regex: /^0999/ } });
  await mongoose.connection.close();
});

describe('🔐 Auth API Integration Tests', () => {
  const testPhone = '0999111222';
  const testPassword = 'Password123!';
  let accessToken = '';
  let refreshToken = '';

  it('POST /api/auth/register → should register new user with 10 Xu welcome credit', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Mẹ Test Auth',
        phone: testPhone,
        password: testPassword,
        districtName: 'Quận Hải Châu',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.phone).toBe(testPhone);
    expect(res.body.user.xuBalance).toBe(10);
    expect(res.body.user.welcomeCreditRemaining).toBe(10);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined(); // Security check: no password leak
  });

  it('POST /api/auth/register → should reject duplicate phone with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate User',
        phone: testPhone,
        password: testPassword,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('đã được đăng ký');
  });

  it('POST /api/auth/login → should login successfully and return tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        phone: testPhone,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /api/auth/login → should reject invalid credentials with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        phone: testPhone,
        password: 'WrongPassword',
      });

    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me → should return current user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.phone).toBe(testPhone);
  });

  it('POST /api/auth/refresh → should rotate tokens successfully', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });
});
