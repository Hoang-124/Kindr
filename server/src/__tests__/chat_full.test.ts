// server/src/__tests__/chat_full.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { ENV } from '../config/env';

const app = createApp();
let seller: any;
let buyer: any;
let stranger: any;
let sellerToken = '';
let buyerToken = '';
let strangerToken = '';
let product: any;
let createdChatId = '';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  await User.deleteMany({ phone: { $in: ['0984111222', '0984333444', '0984555666'] } });

  seller = await User.create({
    name: 'Mẹ Seller Chat Full',
    phone: '0984111222',
    passwordHash,
    xuBalance: 20,
  });

  buyer = await User.create({
    name: 'Mẹ Buyer Chat Full',
    phone: '0984333444',
    passwordHash,
    xuBalance: 30,
  });

  stranger = await User.create({
    name: 'Người Lạ Test Chat Full',
    phone: '0984555666',
    passwordHash,
    xuBalance: 10,
  });

  sellerToken = jwt.sign({ userId: seller._id.toString(), role: 'user' }, ENV.JWT_SECRET);
  buyerToken = jwt.sign({ userId: buyer._id.toString(), role: 'user' }, ENV.JWT_SECRET);
  strangerToken = jwt.sign({ userId: stranger._id.toString(), role: 'user' }, ENV.JWT_SECRET);

  product = await Product.create({
    name: '[TEST] Bình sữa Hegen 240ml PPSU Full',
    description: 'Bình sữa chống đầy hơi cao cấp PPSU Nhật Bản cho bé',
    price: 4,
    condition: '90',
    conditionLabel: 'Mới 90%',
    category: 'do_dung',
    locationName: 'Quận Hải Châu, Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
    sellerId: seller._id,
    sellerName: seller.name,
    status: 'available',
  });
});

afterAll(async () => {
  if (createdChatId) {
    await Message.deleteMany({ chatId: createdChatId });
  }
  await Chat.deleteMany({ productId: product?._id });
  await Product.deleteMany({ sellerId: seller?._id });
  await User.deleteMany({ phone: { $in: ['0984111222', '0984333444', '0984555666'] } });
  await mongoose.connection.close();
});

describe('💬 Chat & Messaging API Full Test Suite', () => {
  describe('1. Create or Retrieve Chat Room (POST /api/chats)', () => {
    it('Lỗi 400 khi tự mở chat với chính mình', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          productId: product._id.toString(),
          sellerId: seller._id.toString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/chính mình/i);
    });

    it('Tạo phòng chat mới thành công giữa Buyer và Seller', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId: product._id.toString(),
          sellerId: seller._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.chat).toBeDefined();
      expect(res.body.isNew).toBe(true);
      expect(res.body.chat.productName).toContain('Bình sữa Hegen');
      createdChatId = res.body.chat._id;

      // Seed messages after chat is created
      await Message.create([
        { chatId: createdChatId, senderId: buyer._id, senderName: buyer.name, content: 'Chào bạn, bình sữa còn không ạ?' },
        { chatId: createdChatId, senderId: seller._id, senderName: seller.name, content: 'Chào bạn, bình còn mới nguyên nhé!' },
      ]);
    });

    it('Không tạo duplicate khi gọi lại cho cùng sản phẩm (trả về chat hiện có)', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId: product._id.toString(),
          sellerId: seller._id.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.chat._id).toBe(createdChatId);
      expect(res.body.isNew).toBe(false);
    });
  });

  describe('2. List Active Chats (GET /api/chats)', () => {
    it('Lấy danh sách các cuộc trò chuyện của user', async () => {
      const res = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.chats)).toBe(true);
      expect(res.body.chats.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Messages Pagination & Access Control (GET /api/chats/:id/messages)', () => {
    it('Lấy danh sách tin nhắn thành công có phân trang', async () => {
      const res = await request(app)
        .get(`/api/chats/${createdChatId}/messages?page=1&limit=10`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });

    it('Lỗi 403 khi người ngoài cuộc trò chuyện cố đọc tin nhắn', async () => {
      const res = await request(app)
        .get(`/api/chats/${createdChatId}/messages`)
        .set('Authorization', `Bearer ${strangerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/không thuộc/i);
    });
  });
});
