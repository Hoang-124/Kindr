// server/src/__tests__/chat_ratings.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { Rating } from '../models/Rating';
import { Report } from '../models/Report';
import { Notification } from '../models/Notification';
import { ENV } from '../config/env';

const app = createApp();
let mom1: any;
let mom2: any;
let token1 = '';
let token2 = '';
let product: any;
let completedTx: any;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  mom1 = await User.create({
    name: 'Mẹ Chat 1',
    phone: '0999123001',
    passwordHash,
    xuBalance: 50,
    civilizationPoints: 95,
  });

  mom2 = await User.create({
    name: 'Mẹ Chat 2',
    phone: '0999123002',
    passwordHash,
    xuBalance: 50,
    civilizationPoints: 95,
  });

  token1 = jwt.sign({ userId: mom1._id.toString(), role: 'user' }, ENV.JWT_SECRET);
  token2 = jwt.sign({ userId: mom2._id.toString(), role: 'user' }, ENV.JWT_SECRET);

  product = await Product.create({
    name: 'Ghế ăn dặm Hanbei cao cấp',
    price: 15,
    condition: '90',
    conditionLabel: 'Mới 90%',
    category: 'do_an_dam',
    locationName: 'Quận Cẩm Lệ, Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=500',
    description: 'Ghế gấp gọn 3 nấc điều chỉnh.',
    sellerId: mom1._id,
    sellerName: mom1.name,
    safeFeeLocked: 2,
    status: 'completed',
  });

  completedTx = await Transaction.create({
    productId: product._id,
    productName: product.name,
    productPrice: 15,
    productImage: product.image,
    buyerId: mom2._id,
    buyerName: mom2.name,
    sellerId: mom1._id,
    sellerName: mom1.name,
    buyerEscrowFrozen: 15,
    sellerEscrowFrozen: 2,
    status: 'completed',
    finalizedAt: new Date(),
  });
});

afterAll(async () => {
  await Chat.deleteMany({ $or: [{ buyerId: mom2._id }, { sellerId: mom1._id }] });
  await Message.deleteMany({});
  await Rating.deleteMany({ transactionId: completedTx._id });
  await Report.deleteMany({ reporterId: mom2._id });
  await Notification.deleteMany({ userId: { $in: [mom1._id, mom2._id] } });
  await Transaction.deleteMany({ _id: completedTx._id });
  await Product.deleteMany({ _id: product._id });
  await User.deleteMany({ phone: { $in: ['0999123001', '0999123002'] } });
  await mongoose.connection.close();
});

describe('💬 Chat, Ratings, Reports & Notifications Integration Tests', () => {
  let chatId = '';

  // 1. Chat Flow
  it('POST /api/chats → should create or retrieve chat conversation', async () => {
    const res = await request(app)
      .post('/api/chats')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        productId: product._id.toString(),
        sellerId: mom1._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.chat).toBeDefined();
    chatId = res.body.chat._id;
  });

  it('GET /api/chats → should list user chats', async () => {
    const res = await request(app)
      .get('/api/chats')
      .set('Authorization', `Bearer ${token2}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.chats)).toBe(true);
    expect(res.body.chats.length).toBeGreaterThan(0);
  });

  // 2. Rating & Civilization Points
  it('POST /api/ratings → should submit rating for completed transaction and award +5 civilization points', async () => {
    const res = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        transactionId: completedTx._id.toString(),
        stars: 5,
        comment: 'Đồ rất đẹp và mới, mẹ bán rất nhiệt tình!',
        tags: ['Giao hàng đúng hẹn', 'Đồ giống ảnh 100%'],
      });

    expect(res.status).toBe(201);
    expect(res.body.rating).toBeDefined();
    expect(res.body.rating.stars).toBe(5);

    // Verify mom1 civilization points increased by +5
    const updatedMom1 = await User.findById(mom1._id);
    expect(updatedMom1?.civilizationPoints).toBe(100); // 95 + 5 = 100
  });

  // 3. Reports Flow
  it('POST /api/reports → should submit safety report', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        targetType: 'user',
        targetId: mom1._id.toString(),
        reason: 'Nghi vấn spam tin nhắn quảng cáo ngoài',
      });

    expect(res.status).toBe(201);
    expect(res.body.report).toBeDefined();
    expect(res.body.report.status).toBe('open');
  });

  // 4. Notifications Flow
  it('GET /api/notifications → should fetch notifications for user', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
  });
});
