// server/src/__tests__/business_rules.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { ENV } from '../config/env';

const app = createApp();
let testSeller: any;
let testBuyer: any;
let sellerToken = '';
let buyerToken = '';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  await User.deleteMany({ phone: { $in: ['0990111222', '0990333444'] } });

  testSeller = await User.create({
    name: 'Mẹ Seller Rules',
    phone: '0990111222',
    passwordHash,
    xuBalance: 10,
    welcomeCreditRemaining: 10,
  });

  testBuyer = await User.create({
    name: 'Mẹ Buyer Rules',
    phone: '0990333444',
    passwordHash,
    xuBalance: 30,
    welcomeCreditRemaining: 10,
  });

  sellerToken = jwt.sign({ userId: testSeller._id.toString(), role: 'user' }, ENV.JWT_SECRET);
  buyerToken = jwt.sign({ userId: testBuyer._id.toString(), role: 'user' }, ENV.JWT_SECRET);
});

afterAll(async () => {
  await Transaction.deleteMany({ sellerId: testSeller?._id });
  await Product.deleteMany({ sellerId: testSeller?._id });
  await User.deleteMany({ phone: { $in: ['0990111222', '0990333444'] } });
  await mongoose.connection.close();
});

describe('📐 Business Rules & Tokenomics Core Invariants', () => {
  describe('Rule 1: Welcome Credit = 10 Xu Non-Withdrawable', () => {
    it('Người dùng mới có 10 Xu chào mừng nhưng không thể rút tiền ngay', async () => {
      const res = await request(app)
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          xuAmount: 5,
          bankName: 'Vietcombank',
          accountNumber: '1234567890',
          accountHolder: 'TEST SELLER',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/quà tặng chào mừng/i);
    });
  });

  describe('Rule 2: SafeFee Calculation (10% Price, Min 1 Xu, Charity 0 Xu)', () => {
    it('Sản phẩm thường (15 Xu) tính SafeFee = 2 Xu (1.5 làm tròn)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: '[TEST] Sản phẩm kiểm tra SafeFee cho bé',
          description: 'Mô tả hợp lệ trên 10 ký tự cho sản phẩm',
          price: 15,
          category: 'do_choi',
          condition: '90',
          conditionLabel: 'Mới 90%',
          locationName: 'Quận Hải Châu, Đà Nẵng',
          image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
        });

      expect(res.status).toBe(201);
      expect(res.body.product.safeFeeLocked).toBe(2);
    });

    it('Sản phẩm từ thiện 0 Xu tính SafeFee = 0 Xu', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: '[TEST] Đồ chơi tặng 0 Xu cho bé',
          description: 'Mô tả đồ tặng từ thiện 0 Xu hợp lệ',
          price: 0,
          category: 'charity',
          condition: '80',
          conditionLabel: 'Mới 80%',
          locationName: 'Quận Hải Châu, Đà Nẵng',
          image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
        });

      expect(res.status).toBe(201);
      expect(res.body.product.safeFeeLocked).toBe(0);
    });
  });

  describe('Rule 3: 6-Hour Safeful Window Timing', () => {
    it('Safeful Time chính xác là 6 giờ kể từ thời điểm bàn giao', async () => {
      const prod = await Product.create({
        name: '[TEST] Xe đẩy kiểm tra giờ cho bé',
        description: 'Mô tả hợp lệ cho xe đẩy kiểm tra giờ',
        price: 5,
        category: 'xe_day',
        condition: '90',
        conditionLabel: 'Mới 90%',
        locationName: 'Quận Hải Châu, Đà Nẵng',
        image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
        sellerId: testSeller._id,
        sellerName: testSeller.name,
        safeFeeLocked: 1,
        status: 'available',
      });

      const txRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId: prod._id.toString() });

      const txId = txRes.body.transaction._id;
      const beforeHandover = Date.now();

      await request(app)
        .post(`/api/transactions/${txId}/handover`)
        .set('Authorization', `Bearer ${sellerToken}`);

      const updatedTx = await Transaction.findById(txId);
      const expiresAt = new Date(updatedTx!.safefulTimeExpiresAt!).getTime();
      const sixHoursMs = 6 * 60 * 60 * 1000;

      // Tolerance +/- 5 seconds
      expect(Math.abs(expiresAt - (beforeHandover + sixHoursMs))).toBeLessThan(5000);
    });
  });
});
