// server/src/__tests__/admin_full.test.ts
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
let testProduct: any;
let testDisputeTx: any;
let testWithdraw: any;
let testReport: any;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  await User.deleteMany({ phone: { $in: ['0980000111', '0980000222'] } });

  adminUser = await User.create({
    name: 'Admin Test Suite Full',
    phone: '0980000111',
    passwordHash,
    role: 'admin',
    xuBalance: 1000,
  });

  regularUser = await User.create({
    name: 'User Normal Test Full',
    phone: '0980000222',
    passwordHash,
    role: 'user',
    xuBalance: 50,
  });

  adminToken = jwt.sign({ userId: adminUser._id.toString(), role: 'admin' }, ENV.JWT_SECRET);
  userToken = jwt.sign({ userId: regularUser._id.toString(), role: 'user' }, ENV.JWT_SECRET);

  testProduct = await Product.create({
    name: '[TEST] Sản phẩm thử nghiệm Admin',
    description: 'Mô tả hợp lệ cho sản phẩm test của admin portal',
    price: 10,
    condition: '90',
    conditionLabel: 'Mới 90%',
    locationName: 'Quận Hải Châu, Đà Nẵng',
    category: 'do_choi',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
    sellerId: regularUser._id,
    sellerName: regularUser.name,
    status: 'available',
  });

  testDisputeTx = await Transaction.create({
    productId: testProduct._id,
    productName: testProduct.name,
    productImage: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
    productPrice: 10,
    buyerId: regularUser._id,
    buyerName: regularUser.name,
    sellerId: adminUser._id,
    sellerName: adminUser.name,
    buyerEscrowFrozen: 10,
    sellerEscrowFrozen: 1,
    status: 'disputed',
    disputeReason: 'Hàng không đúng cam kết',
  });

  testWithdraw = await WithdrawRequest.create({
    userId: regularUser._id,
    userName: regularUser.name,
    userPhone: regularUser.phone,
    xuAmount: 10,
    vndAmount: 100000,
    feeVnd: 10000,
    payoutVnd: 90000,
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountHolder: 'USER NORMAL',
    status: 'pending',
  });

  testReport = await Report.create({
    targetType: 'product',
    targetId: testProduct._id,
    reporterId: regularUser._id,
    reporterName: regularUser.name,
    reason: 'Sản phẩm vi phạm tiêu chuẩn cộng đồng',
    status: 'open',
  });
});

afterAll(async () => {
  await Report.deleteMany({ _id: testReport?._id });
  await WithdrawRequest.deleteMany({ _id: testWithdraw?._id });
  await Transaction.deleteMany({ _id: testDisputeTx?._id });
  await Product.deleteMany({ _id: testProduct?._id });
  await User.deleteMany({ phone: { $in: ['0980000111', '0980000222'] } });
  await mongoose.connection.close();
});

describe('👑 Admin Portal API Full Test Suite', () => {
  describe('1. Access Control Guard', () => {
    it('Chặn người dùng thông thường (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/admin/i);
    });
  });

  describe('2. Admin Dashboard & Stats (GET /api/admin/dashboard)', () => {
    it('Admin lấy tổng quan số liệu thống kê thành công', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalUsers).toBeDefined();
      expect(res.body.totalProducts).toBeDefined();
      expect(res.body.totalTransactions).toBeDefined();
    });
  });

  describe('3. User Management (GET/PUT /api/admin/users)', () => {
    it('Lấy danh sách người dùng', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('Khóa và mở khóa tài khoản người dùng', async () => {
      // Lock
      const lockRes = await request(app)
        .put(`/api/admin/users/${regularUser._id}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Vi phạm quy định an toàn' });

      expect(lockRes.status).toBe(200);
      expect(lockRes.body.user.isLocked).toBe(true);

      // Unlock
      const unlockRes = await request(app)
        .put(`/api/admin/users/${regularUser._id}/unlock`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unlockRes.status).toBe(200);
      expect(unlockRes.body.user.isLocked).toBe(false);
    });
  });

  describe('4. Dispute Resolution (PUT /api/admin/disputes/:id/resolve)', () => {
    it('Admin giải quyết tranh chấp (hoàn Xu cho Buyer)', async () => {
      const res = await request(app)
        .put(`/api/admin/disputes/${testDisputeTx._id}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ outcome: 'resolved_buyer', note: 'Chấp thuận hoàn tiền cho Buyer' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/thành công/i);

      const tx = await Transaction.findById(testDisputeTx._id);
      expect(tx?.status).toBe('refunded');
      expect(tx?.disputeStatus).toBe('resolved_buyer');
    });
  });

  describe('5. Withdraw Processing (PUT /api/admin/withdraws/:id/approve)', () => {
    it('Admin duyệt lệnh rút tiền thành công', async () => {
      const res = await request(app)
        .put(`/api/admin/withdraws/${testWithdraw._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ transferRef: 'VND_REF_123456' });

      expect(res.status).toBe(200);
      expect(res.body.withdrawRequest.status).toBe('approved');
    });
  });

  describe('6. Report Moderation (PUT /api/admin/reports/:id)', () => {
    it('Admin xử lý và cập nhật báo cáo vi phạm', async () => {
      const res = await request(app)
        .put(`/api/admin/reports/${testReport._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'reviewed', adminNote: 'Đã nhắc nhở người dùng' });

      expect(res.status).toBe(200);
      expect(res.body.report.status).toBe('reviewed');
    });
  });
});
