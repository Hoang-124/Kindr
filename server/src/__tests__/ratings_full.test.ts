// server/src/__tests__/ratings_full.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { Rating } from '../models/Rating';
import { Notification } from '../models/Notification';
import { ENV } from '../config/env';

const app = createApp();
let seller: any;
let buyer: any;
let sellerToken = '';
let buyerToken = '';
let completedTx: any;
let ongoingTx: any;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  await User.deleteMany({ phone: { $in: ['0993111222', '0993333444'] } });

  seller = await User.create({
    name: 'Mẹ Seller Rating',
    phone: '0993111222',
    passwordHash,
    civilizationPoints: 90,
    ratingCount: 0,
    reputationScore: 5.0,
  });

  buyer = await User.create({
    name: 'Mẹ Buyer Rating',
    phone: '0993333444',
    passwordHash,
    civilizationPoints: 90,
  });

  sellerToken = jwt.sign({ userId: seller._id.toString(), role: 'user' }, ENV.JWT_SECRET);
  buyerToken = jwt.sign({ userId: buyer._id.toString(), role: 'user' }, ENV.JWT_SECRET);

  completedTx = await Transaction.create({
    productId: new mongoose.Types.ObjectId(),
    productName: 'Xe chòi chân cho bé',
    productImage: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
    productPrice: 6,
    buyerId: buyer._id,
    buyerName: buyer.name,
    sellerId: seller._id,
    sellerName: seller.name,
    buyerEscrowFrozen: 6,
    sellerEscrowFrozen: 1,
    status: 'completed',
  });

  ongoingTx = await Transaction.create({
    productId: new mongoose.Types.ObjectId(),
    productName: 'Máy tiệt trùng bình sữa',
    productImage: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
    productPrice: 12,
    buyerId: buyer._id,
    buyerName: buyer.name,
    sellerId: seller._id,
    sellerName: seller.name,
    buyerEscrowFrozen: 12,
    sellerEscrowFrozen: 2,
    status: 'in_safeful_time',
  });
});

afterAll(async () => {
  await Rating.deleteMany({ transactionId: completedTx?._id });
  await Notification.deleteMany({ userId: seller?._id });
  await Transaction.deleteMany({ _id: { $in: [completedTx?._id, ongoingTx?._id] } });
  await User.deleteMany({ phone: { $in: ['0993111222', '0993333444'] } });
  await mongoose.connection.close();
});

describe('⭐ Ratings & Civilization Reputation Full Test Suite', () => {
  describe('1. Submit Rating (POST /api/ratings)', () => {
    it('Lỗi 400 khi cố đánh giá giao dịch chưa hoàn tất', async () => {
      const res = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          transactionId: ongoingTx._id.toString(),
          stars: 5,
          comment: 'Chưa xong mà đòi đánh giá',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/hoàn tất/i);
    });

    it('Đánh giá 5 sao thành công và cộng +5 Điểm Văn Minh cho Seller', async () => {
      const res = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          transactionId: completedTx._id.toString(),
          stars: 5,
          comment: 'Mẹ giao hàng rất nhanh và đóng gói cẩn thận!',
          tags: ['Giao nhanh', 'Thân thiện', 'Đồ chuẩn like-new'],
        });

      expect(res.status).toBe(201);
      expect(res.body.rating).toBeDefined();
      expect(res.body.rating.stars).toBe(5);

      // Verify seller civilization points increased by +5 (90 -> 95)
      const updatedSeller = await User.findById(seller._id);
      expect(updatedSeller?.civilizationPoints).toBe(95);
      expect(updatedSeller?.ratingCount).toBe(1);
      expect(updatedSeller?.reputationScore).toBe(5.0);
    });

    it('Lỗi 400 khi đánh giá lại lần 2 cho cùng 1 giao dịch', async () => {
      const res = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          transactionId: completedTx._id.toString(),
          stars: 4,
          comment: 'Đánh giá lần 2',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/đã đánh giá/i);
    });
  });

  describe('2. Get Public User Ratings (GET /api/ratings/user/:userId)', () => {
    it('Lấy danh sách đánh giá của seller và tính điểm trung bình', async () => {
      const res = await request(app).get(`/api/ratings/user/${seller._id}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.ratings)).toBe(true);
      expect(res.body.totalCount).toBe(1);
      expect(res.body.averageStars).toBe(5.0);
    });
  });
});
