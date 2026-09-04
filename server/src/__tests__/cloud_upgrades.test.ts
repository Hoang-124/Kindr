// server/src/__tests__/cloud_upgrades.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { TopupOrder } from '../models/TopupOrder';
import { CareRecord } from '../models/CareRecord';
import { ENV } from '../config/env';
import * as escrowService from '../services/escrowService';

const app = createApp();

let motherA: any;
let motherB: any;
let tokenA = '';
let tokenB = '';
let testProduct: any;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  motherA = await User.create({
    name: 'Mẹ Vân (Người Bán)',
    phone: '0981112233',
    passwordHash,
    xuBalance: 50,
    civilizationPoints: 100,
  });

  motherB = await User.create({
    name: 'Mẹ Lan (Người Mua)',
    phone: '0984445566',
    passwordHash,
    xuBalance: 50,
    civilizationPoints: 100,
  });

  tokenA = jwt.sign({ userId: motherA._id.toString(), role: 'user' }, ENV.JWT_SECRET);
  tokenB = jwt.sign({ userId: motherB._id.toString(), role: 'user' }, ENV.JWT_SECRET);

  testProduct = await Product.create({
    name: 'Xe đẩy Combi Nhật Bản Siêu Nhẹ',
    price: 15,
    condition: '90',
    conditionLabel: 'Mới 90%',
    category: 'xe_noi',
    locationName: 'Phường Thạch Thang, Quận Hải Châu, Đà Nẵng',
    coordinates: { latitude: 16.075, longitude: 108.221 },
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    description: 'Xe đẩy em bé còn rất mới, khung xe chắc chắn, vải đệm sạch sẽ.',
    sellerId: motherA._id,
    sellerName: motherA.name,
    safeFeeLocked: 2,
    status: 'available',
  });
});

afterAll(async () => {
  await User.deleteMany({ phone: { $in: ['0981112233', '0984445566'] } });
  await Product.deleteMany({ sellerId: motherA._id });
  await TopupOrder.deleteMany({ userId: { $in: [motherA._id, motherB._id] } });
  await CareRecord.deleteMany({ userId: { $in: [motherA._id, motherB._id] } });
  await mongoose.connection.close();
});

describe('☁️ Cloud Upgrades, Security & Atomic Escrow Integration Tests', () => {
  describe('1. Cloudinary Image Upload Pipeline (POST /api/upload)', () => {
    it('Lỗi 401 khi không gửi token xác thực', async () => {
      const res = await request(app)
        .post('/api/upload')
        .send({ image: 'data:image/jpeg;base64,sample' });

      expect(res.status).toBe(401);
    });

    it('Upload ảnh hợp lệ lên Cloudinary và nhận URL CDN an toàn', async () => {
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4',
          folder: 'kindr/test_products',
        });

      expect(res.status).toBe(201);
      expect(res.body.url).toBeDefined();
      expect(res.body.url).toContain('http');
      expect(res.body.publicId).toBeDefined();
    }, 15000);
  });

  describe('2. Atomic Escrow CAS & Concurrency Defense', () => {
    it('Tạo giao dịch thành công và sinh mã xác nhận bàn giao 6 ký tự', async () => {
      const result = await escrowService.createEscrow(motherB._id.toString(), testProduct._id.toString());
      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.transaction.handoverCode).toBeDefined();
      expect(result.transaction.handoverCode.length).toBe(6);
      expect(result.transaction.status).toBe('awaiting_handover');

      // Product is now in 'escrow'
      const checkProduct = await Product.findById(testProduct._id);
      expect(checkProduct?.status).toBe('escrow');
    });

    it('Chặn mua đồng thời: Lần 2 cố mua cùng 1 sản phẩm bị từ chối ngay lập tức (Atomic Protection)', async () => {
      // Third buyer attempts to buy the same product
      const result = await escrowService.createEscrow(motherB._id.toString(), testProduct._id.toString());
      expect(result.success).toBe(false);
      expect(result.error).toContain('không khả dụng');
    });
  });

  describe('3. TopupOrder & Bank Transfer Webhook on Cloud', () => {
    let orderCode = '';

    it('Tạo đơn nạp Xu (POST /api/wallet/topup) lưu vào Cloud DB', async () => {
      const res = await request(app)
        .post('/api/wallet/topup')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ xuAmount: 20 });

      expect(res.status).toBe(200);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.orderCode).toBeDefined();
      expect(res.body.order.vietqrUrl).toBeDefined();

      orderCode = res.body.order.orderCode;
    });

    it('Webhook từ chối request có secret không hợp lệ (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/wallet/webhook')
        .set('x-webhook-secret', 'wrong_secret_123')
        .send({ orderCode });

      expect(res.status).toBe(401);
    });

    it('Tạo đơn nạp pending và xử lý Webhook ngân hàng thành công', async () => {
      const pendingOrder = await TopupOrder.create({
        orderCode: 'TOPUP_TEST_BANK_123',
        userId: motherB._id,
        userName: motherB.name,
        xuAmount: 15,
        vndAmount: 150000,
        status: 'pending',
        memo: 'KINDR NAP 15XU TOPUP_TEST_BANK_123',
        vietqrUrl: 'https://img.vietqr.io/image/MB-0905123456-compact.png',
      });

      const initialUser = await User.findById(motherB._id);
      const prevBalance = initialUser!.xuBalance;

      const res = await request(app)
        .post('/api/wallet/webhook')
        .set('x-webhook-secret', ENV.WEBHOOK_SECRET)
        .send({
          orderCode: pendingOrder.orderCode,
          content: 'KINDR NAP 15XU TOPUP_TEST_BANK_123',
          transactionRef: 'VCB_REF_998877',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const afterUser = await User.findById(motherB._id);
      expect(afterUser!.xuBalance).toBe(prevBalance + 15);
    });
  });

  describe('4. Care Handbook Cloud Persistence (Sổ Tay Mẹ Bỉm)', () => {
    it('Lưu và đánh dấu trạng thái tiêm chủng của bé (POST /api/care/vaccines/toggle)', async () => {
      const res = await request(app)
        .post('/api/care/vaccines/toggle')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          vaccineId: 'v1_bcg',
          vaccineName: 'Lao (BCG) & Viêm gan B',
          isCompleted: true,
          facilityName: 'Bệnh viện Phụ sản - Nhi Đà Nẵng',
          notes: 'Bé ngoan, không sốt sau tiêm',
        });

      expect(res.status).toBe(200);
      expect(res.body.record).toBeDefined();
      expect(res.body.record.isCompleted).toBe(true);
    });

    it('Lấy danh sách sổ tiêm chủng từ Cloud DB (GET /api/care/vaccines)', async () => {
      const res = await request(app)
        .get('/api/care/vaccines')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.vaccines).toBeDefined();
      expect(res.body.vaccines.length).toBeGreaterThan(0);
      expect(res.body.vaccines[0].vaccineId).toBe('v1_bcg');
    });

    it('Thêm chỉ số tăng trưởng chuẩn WHO lên Cloud (POST /api/care/growth)', async () => {
      const res = await request(app)
        .post('/api/care/growth')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          childName: 'Bé Bắp',
          date: '04/09/2026',
          ageMonths: 6,
          weightKg: 7.8,
          heightCm: 67.5,
        });

      expect(res.status).toBe(201);
      expect(res.body.record.weightKg).toBe(7.8);
      expect(res.body.record.whoWeightStatus).toBe('normal');
    });
  });

  describe('5. Hyper-Local GPS Distance Filtering (GET /api/products)', () => {
    it('Tính toán khoảng cách động chính xác khi truyền lat/lng', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({
          lat: 16.074,
          lng: 108.220,
        });

      expect(res.status).toBe(200);
      expect(res.body.products).toBeDefined();
      if (res.body.products.length > 0) {
        expect(res.body.products[0].distance).toBeDefined();
        expect(res.body.products[0].distance).toContain('km');
      }
    });
  });
});
