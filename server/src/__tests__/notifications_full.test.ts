// server/src/__tests__/notifications_full.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { ENV } from '../config/env';

const app = createApp();
let testUser: any;
let authToken = '';
let notificationId = '';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  await User.deleteMany({ phone: '0994111222' });

  testUser = await User.create({
    name: 'Mẹ Test Notification',
    phone: '0994111222',
    passwordHash,
    xuBalance: 20,
  });

  authToken = jwt.sign({ userId: testUser._id.toString(), role: 'user' }, ENV.JWT_SECRET);

  const notifs = await Notification.create([
    {
      userId: testUser._id,
      type: 'xu_received',
      title: 'Nhận 10 Xu chào mừng',
      body: 'Chào mừng mẹ đến với cộng đồng Kindr',
      isRead: false,
    },
    {
      userId: testUser._id,
      type: 'handover_confirmed',
      title: 'Đơn hàng đang trong 6h kiểm định',
      body: 'Người bán đã bàn giao đồ chơi Montessori',
      isRead: false,
    },
  ]);
  notificationId = notifs[0]._id.toString();
});

afterAll(async () => {
  await Notification.deleteMany({ userId: testUser._id });
  await User.deleteMany({ phone: '0994111222' });
  await mongoose.connection.close();
});

describe('🔔 Notifications API Full Test Suite', () => {
  describe('1. Unread Count (GET /api/notifications/unread-count)', () => {
    it('Đếm số lượng thông báo chưa đọc chính xác', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });
  });

  describe('2. Get Notifications (GET /api/notifications)', () => {
    it('Lấy danh sách thông báo phân trang sắp xếp mới nhất', async () => {
      const res = await request(app)
        .get('/api/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(res.body.notifications.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe('3. Mark Single as Read (PUT /api/notifications/:id/read)', () => {
    it('Đánh dấu 1 thông báo đã đọc thành công', async () => {
      const res = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notification.isRead).toBe(true);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`);
      expect(countRes.body.count).toBe(1);
    });
  });

  describe('4. Mark All as Read (PUT /api/notifications/read-all)', () => {
    it('Đánh dấu tất cả thông báo đã đọc', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.updatedCount).toBe(1);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`);
      expect(countRes.body.count).toBe(0);
    });
  });
});
