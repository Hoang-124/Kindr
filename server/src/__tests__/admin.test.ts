// server/src/__tests__/admin.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { WithdrawRequest } from '../models/WithdrawRequest';
import { Report } from '../models/Report';
import { ENV } from '../config/env';

const app = createApp();
let adminUser: any;
let regularUser: any;
let adminToken = '';
let userToken = '';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  adminUser = await User.create({
    name: 'Admin Test Suite',
    phone: '0999000111',
    passwordHash,
    role: 'admin',
    xuBalance: 1000,
  });

  regularUser = await User.create({
    name: 'User Normal Test',
    phone: '0999000222',
    passwordHash,
    role: 'user',
    xuBalance: 50,
  });

  adminToken = jwt.sign({ userId: adminUser._id.toString(), role: 'admin' }, ENV.JWT_SECRET);
  userToken = jwt.sign({ userId: regularUser._id.toString(), role: 'user' }, ENV.JWT_SECRET);
});

afterAll(async () => {
  await User.deleteMany({ phone: { $in: ['0999000111', '0999000222'] } });
  await mongoose.connection.close();
});

describe('🛡️ Admin Suite Integration Tests', () => {
  it('GET /api/admin/dashboard → should REJECT regular user with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Admin');
  });

  it('GET /api/admin/dashboard → should ALLOW admin and return stats', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalUsers).toBeDefined();
    expect(res.body.totalProducts).toBeDefined();
  });

  it('GET /api/admin/users → should list users with pagination', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('PUT /api/admin/users/:id/lock → should lock user', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${regularUser._id}/lock`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.isLocked).toBe(true);

    // Unlock
    const unlockRes = await request(app)
      .put(`/api/admin/users/${regularUser._id}/unlock`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(unlockRes.status).toBe(200);
    expect(unlockRes.body.user.isLocked).toBe(false);
  });
});
