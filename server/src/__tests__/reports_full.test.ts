// server/src/__tests__/reports_full.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Report } from '../models/Report';
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

  await User.deleteMany({ phone: '0992111222' });

  testUser = await User.create({
    name: 'Mẹ Test Reporter',
    phone: '0992111222',
    passwordHash,
    xuBalance: 20,
  });

  authToken = jwt.sign({ userId: testUser._id.toString(), role: 'user' }, ENV.JWT_SECRET);
});

afterAll(async () => {
  await Report.deleteMany({ reporterId: testUser._id });
  await User.deleteMany({ phone: '0992111222' });
  await mongoose.connection.close();
});

describe('🛡️ Reports & Trust Safety Full Test Suite', () => {
  describe('1. File a Report (POST /api/reports)', () => {
    it('Lỗi 400 khi lý do báo cáo quá ngắn (< 5 ký tự)', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetType: 'product',
          targetId: new mongoose.Types.ObjectId().toString(),
          reason: 'xấu',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/từ 5 ký tự/i);
    });

    it('Gửi báo cáo vi phạm thành công', async () => {
      const fakeProductId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetType: 'product',
          targetId: fakeProductId,
          reason: 'Sản phẩm có dấu hiệu lừa đảo và hình ảnh lấy trên mạng',
        });

      expect(res.status).toBe(201);
      expect(res.body.report).toBeDefined();
      expect(res.body.report.status).toBe('open');
      expect(res.body.report.targetType).toBe('product');
    });
  });

  describe('2. Get My Reports (GET /api/reports/my)', () => {
    it('Lấy danh sách các báo cáo do tôi đã gửi', async () => {
      const res = await request(app)
        .get('/api/reports/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.reports)).toBe(true);
      expect(res.body.reports.length).toBe(1);
    });
  });
});
