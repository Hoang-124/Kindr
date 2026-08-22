// server/src/__tests__/transactions_escrow.test.ts
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
let seller: any;
let buyer: any;
let stranger: any;
let sellerToken = '';
let buyerToken = '';
let strangerToken = '';
let product1: any;
let product2: any;
let transactionId = '';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  await User.deleteMany({ phone: { $in: ['0986111222', '0986333444', '0986555666'] } });

  seller = await User.create({
    name: 'Mẹ Seller Escrow Full',
    phone: '0986111222',
    passwordHash,
    xuBalance: 20,
    welcomeCreditRemaining: 0,
    civilizationPoints: 95,
  });

  buyer = await User.create({
    name: 'Mẹ Buyer Escrow Full',
    phone: '0986333444',
    passwordHash,
    xuBalance: 30,
    welcomeCreditRemaining: 0,
    civilizationPoints: 95,
  });

  stranger = await User.create({
    name: 'Người Lạ Escrow Full',
    phone: '0986555666',
    passwordHash,
    xuBalance: 10,
    welcomeCreditRemaining: 0,
    civilizationPoints: 90,
  });

  sellerToken = jwt.sign({ userId: seller._id.toString(), role: 'user' }, ENV.JWT_SECRET);
  buyerToken = jwt.sign({ userId: buyer._id.toString(), role: 'user' }, ENV.JWT_SECRET);
  strangerToken = jwt.sign({ userId: stranger._id.toString(), role: 'user' }, ENV.JWT_SECRET);

  product1 = await Product.create({
    name: '[TEST] Nôi cũi gỗ sồi tự nhiên',
    description: 'Nôi cũi gỗ sồi chắc chắn, đệm êm ái cho bé ngủ ngon',
    price: 10,
    condition: '90',
    conditionLabel: 'Mới 90%',
    category: 'noi_cui',
    locationName: 'Quận Sơn Trà, Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
    sellerId: seller._id,
    sellerName: seller.name,
    safeFeeLocked: 1,
    status: 'available',
  });
  seller.xuBalance -= 1;
  seller.xuFrozen += 1;
  await seller.save();

  product2 = await Product.create({
    name: '[TEST] Ghế ăn dặm cao cấp',
    description: 'Ghế ăn dặm gập gọn có thể điều chỉnh 3 nấc',
    price: 8,
    condition: '80',
    conditionLabel: 'Mới 80%',
    category: 'ghe_an',
    locationName: 'Quận Hải Châu, Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
    sellerId: seller._id,
    sellerName: seller.name,
    safeFeeLocked: 1,
    status: 'available',
  });
});

afterAll(async () => {
  await Transaction.deleteMany({ $or: [{ buyerId: buyer?._id }, { sellerId: seller?._id }] });
  await Product.deleteMany({ sellerId: seller?._id });
  await User.deleteMany({ phone: { $in: ['0986111222', '0986333444', '0986555666'] } });
  await mongoose.connection.close();
});

describe('⚖️ Double Escrow & Dispute Lifecycle Full Test Suite', () => {
  describe('1. Create Escrow Transaction (POST /api/transactions)', () => {
    it('Lỗi 400 khi tự mua sản phẩm của chính mình', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ productId: product1._id.toString() });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/của mình|chính mình/i);
    });

    it('Tạo giao dịch thành công và đóng băng 100% Xu của Buyer + 10% SafeFee của Seller', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId: product1._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.transaction).toBeDefined();
      expect(res.body.transaction.status).toBe('awaiting_handover');
      expect(res.body.transaction.buyerEscrowFrozen).toBe(10);
      expect(res.body.transaction.sellerEscrowFrozen).toBe(1);
      transactionId = res.body.transaction._id;

      // Buyer bị trừ 10 balance và tăng 10 frozen
      const updatedBuyer = await User.findById(buyer._id);
      expect(updatedBuyer?.xuBalance).toBe(20);
      expect(updatedBuyer?.xuFrozen).toBe(10);
    });
  });

  describe('2. Get Transaction Details (GET /api/transactions/:id)', () => {
    it('Xem chi tiết giao dịch unmask đầy đủ SĐT của cả buyer và seller', async () => {
      const res = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.transaction).toBeDefined();
      expect(res.body.transaction.sellerPhone || res.body.transaction.sellerId?.phone).toBeDefined();
    });

    it('Lấy danh sách giao dịch của tôi (GET /api/transactions/my)', async () => {
      const res = await request(app)
        .get('/api/transactions/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.transactions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Handover & 6-Hour Safeful Window', () => {
    it('Lỗi 400 khi Người lạ cố xác nhận bàn giao thay', async () => {
      const res = await request(app)
        .post(`/api/transactions/${transactionId}/handover`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Không có quyền/i);
    });

    it('Seller hoặc Buyer xác nhận bàn giao đồ và kích hoạt đếm ngược 6 giờ Safeful Time', async () => {
      const res = await request(app)
        .post(`/api/transactions/${transactionId}/handover`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/6 Giờ|kiểm định|bàn giao/i);

      const tx = await Transaction.findById(transactionId);
      expect(tx?.status).toBe('in_safeful_time');
      expect(tx?.safefulTimeExpiresAt).toBeDefined();
    });
  });

  describe('4. Complete Transaction & Xu Release', () => {
    it('Buyer xác nhận hài lòng và hoàn tất giao dịch → release Xu cho Seller', async () => {
      const res = await request(app)
        .post(`/api/transactions/${transactionId}/complete`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/hoàn tất/i);

      const tx = await Transaction.findById(transactionId);
      expect(tx?.status).toBe('completed');

      // Seller nhận 10 Xu từ buyer + hoàn 1 Xu SafeFee = tổng +11 Xu
      const updatedSeller = await User.findById(seller._id);
      expect(updatedSeller?.xuBalance).toBe(30);
      expect(updatedSeller?.xuFrozen).toBe(0);
    });
  });

  describe('5. Dispute Flow on new transaction', () => {
    let disputeTxId = '';

    it('Tạo giao dịch thứ 2 và mở Dispute khi có tranh chấp', async () => {
      // Create tx2
      const txRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productId: product2._id.toString() });

      expect(txRes.status).toBe(201);
      disputeTxId = txRes.body.transaction._id;

      // Handover
      await request(app)
        .post(`/api/transactions/${disputeTxId}/handover`)
        .set('Authorization', `Bearer ${sellerToken}`);

      // File Dispute
      const disputeRes = await request(app)
        .post(`/api/transactions/${disputeTxId}/dispute`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          reason: 'Hàng không đúng mô tả, ghế bị nứt gãy chân',
          images: ['https://example.com/broken_chair.jpg'],
        });

      expect(disputeRes.status).toBe(200);
      const disputedTx = await Transaction.findById(disputeTxId);
      expect(disputedTx?.status).toBe('disputed');
    });
  });
});
