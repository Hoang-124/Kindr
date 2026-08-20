// server/src/__tests__/products.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { ENV } from '../config/env';

const app = createApp();
let seller: any;
let sellerToken = '';
let createdProductId = '';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  seller = await User.create({
    name: 'Mẹ Test Seller',
    phone: '0999555666',
    passwordHash,
    xuBalance: 50,
    welcomeCreditRemaining: 0,
    civilizationPoints: 95,
  });

  sellerToken = jwt.sign({ userId: seller._id.toString(), role: 'user' }, ENV.JWT_SECRET);
});

afterAll(async () => {
  await Product.deleteMany({ sellerId: seller._id });
  await User.deleteMany({ phone: '0999555666' });
  await mongoose.connection.close();
});

describe('📦 Products API Integration Tests', () => {
  it('POST /api/products → should create product and lock 10% Safe Fee from seller', async () => {
    const price = 20; // 20 Xu -> SafeFee 10% = 2 Xu
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Xe đẩy em bé Combi Nhật Bản',
        price,
        condition: '90',
        conditionLabel: 'Mới 90% (Rất mới)',
        category: 'xe_day',
        locationName: 'Quận Hải Châu, Đà Nẵng',
        image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=500',
        description: 'Xe đẩy du lịch gấp gọn siêu nhẹ cho bé từ sơ sinh đến 3 tuổi.',
      });

    expect(res.status).toBe(201);
    expect(res.body.product).toBeDefined();
    expect(res.body.product.safeFeeLocked).toBe(2); // 10% of 20 Xu
    createdProductId = res.body.product._id;

    // Check seller balance was deducted
    const updatedSeller = await User.findById(seller._id);
    expect(updatedSeller?.xuBalance).toBe(48); // 50 - 2
    expect(updatedSeller?.xuFrozen).toBe(2);
  });

  it('GET /api/products/:id → should return product details', async () => {
    const res = await request(app).get(`/api/products/${createdProductId}`);
    expect(res.status).toBe(200);
    expect(res.body.product.name).toContain('Xe đẩy em bé Combi');
  });

  it('GET /api/products/invalid_id → should return 400 Bad Request instead of 500 CastError crash', async () => {
    const res = await request(app).get('/api/products/not-a-valid-object-id');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('không hợp lệ');
  });

  it('GET /api/products → should return paginated list of available products', async () => {
    const res = await request(app).get('/api/products?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });
});
