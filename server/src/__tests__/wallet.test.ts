// server/src/__tests__/wallet.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { ENV } from '../config/env';

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
    name: 'Mẹ Test Wallet',
    phone: '0999333444',
    passwordHash,
    xuBalance: 10,
    welcomeCreditRemaining: 10, // 10 Xu gift cannot be cashed out
    civilizationPoints: 95,
  });

  authToken = jwt.sign({ userId: testUser._id.toString(), role: 'user' }, ENV.JWT_SECRET);
});

afterAll(async () => {
  await User.deleteMany({ phone: '0999333444' });
  await mongoose.connection.close();
});

describe('💰 Wallet & Tokenomics Integration Tests', () => {
  it('POST /api/wallet/withdraw → should BLOCK withdrawing Welcome Credit gift Xu', async () => {
    // User has 10 Xu total, but all 10 Xu is Welcome Credit -> Withdrawable = 0 Xu
    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        xuAmount: 5,
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountHolder: 'NGUYEN THI TEST',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('quà tặng chào mừng');
  });

  it('POST /api/wallet/topup → should credit Xu to user balance', async () => {
    const res = await request(app)
      .post('/api/wallet/topup')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ xuAmount: 20 });

    expect(res.status).toBe(200);
    expect(res.body.newBalance).toBe(30); // 10 + 20
  });

  it('POST /api/wallet/withdraw → should ALLOW withdrawing earned/topped-up Xu', async () => {
    // Now user has 30 Xu total, 10 Xu welcome gift -> Withdrawable = 20 Xu
    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        xuAmount: 10,
        bankName: 'MB Bank',
        accountNumber: '9876543210',
        accountHolder: 'NGUYEN THI TEST',
      });

    expect(res.status).toBe(201);
    expect(res.body.withdrawRequest).toBeDefined();
    expect(res.body.withdrawRequest.status).toBe('pending');
    expect(res.body.withdrawRequest.xuAmount).toBe(10);
  });
});
