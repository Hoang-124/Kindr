// server/src/__tests__/wallet_full.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { WithdrawRequest } from '../models/WithdrawRequest';
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

  await User.deleteMany({ phone: '0996111222' });

  testUser = await User.create({
    name: 'Mẹ Test Wallet Full',
    phone: '0996111222',
    passwordHash,
    xuBalance: 10,
    welcomeCreditRemaining: 10,
    civilizationPoints: 95,
  });

  authToken = jwt.sign({ userId: testUser._id.toString(), role: 'user' }, ENV.JWT_SECRET);
});

afterAll(async () => {
  await WithdrawRequest.deleteMany({ userId: testUser._id });
  await User.deleteMany({ phone: '0996111222' });
  await mongoose.connection.close();
});

describe('💰 Wallet API Full Test Suite', () => {
  describe('1. Get Balance (GET /api/wallet/balance)', () => {
    it('Lấy số dư Xu và thông tin tín dụng chào mừng', async () => {
      const res = await request(app)
        .get('/api/wallet/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.xuBalance).toBe(10);
      expect(res.body.welcomeCreditRemaining).toBe(10);
      expect(res.body.totalXu).toBe(10);
    });
  });

  describe('2. Topup Xu (POST /api/wallet/topup)', () => {
    it('Lỗi 400 khi nạp số Xu <= 0', async () => {
      const res = await request(app)
        .post('/api/wallet/topup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ xuAmount: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('Nạp 30 Xu thành công và cập nhật số dư', async () => {
      const res = await request(app)
        .post('/api/wallet/topup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ xuAmount: 30 });

      expect(res.status).toBe(200);
      expect(res.body.newBalance).toBe(40); // 10 + 30
      expect(res.body.vietqrUrl).toBeDefined();
    });
  });

  describe('3. Withdraw Xu (POST /api/wallet/withdraw)', () => {
    it('Lỗi 400 khi thiếu thông tin ngân hàng bắt buộc', async () => {
      const res = await request(app)
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          xuAmount: 10,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('Lỗi 400 khi rút vượt quá số dư khả dụng (withdrawableXu)', async () => {
      // Balance = 40, Welcome credit = 10 -> Withdrawable = 30
      const res = await request(app)
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          xuAmount: 35,
          bankName: 'Vietcombank',
          accountNumber: '1234567890',
          accountHolder: 'NGUYEN THI TEST',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/quà tặng chào mừng|không đủ/i);
    });

    it('Tạo yêu cầu rút Xu thành công và tính phí 10% chuẩn xác', async () => {
      // Rút 20 Xu: vndAmount = 200,000, fee = 20,000 (10%), payout = 180,000 (90%)
      const res = await request(app)
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          xuAmount: 20,
          bankName: 'MB Bank',
          accountNumber: '9876543210',
          accountHolder: 'NGUYEN THI TEST',
        });

      expect(res.status).toBe(201);
      expect(res.body.withdrawRequest).toBeDefined();
      expect(res.body.withdrawRequest.status).toBe('pending');
      expect(res.body.withdrawRequest.xuAmount).toBe(20);
      expect(res.body.withdrawRequest.feeVnd).toBe(20000);
      expect(res.body.withdrawRequest.payoutVnd).toBe(180000);
    });
  });

  describe('4. Wallet History (GET /api/wallet/history)', () => {
    it('Lấy lịch sử giao dịch và yêu cầu rút tiền thành công', async () => {
      const res = await request(app)
        .get('/api/wallet/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.withdrawRequests)).toBe(true);
      expect(res.body.withdrawRequests.length).toBeGreaterThanOrEqual(1);
    });
  });
});
