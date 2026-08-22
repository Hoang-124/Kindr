// server/src/__tests__/products_full.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { ENV } from '../config/env';

const app = createApp();

let userToken = '';
let otherUserToken = '';
let userId = '';
let otherUserId = '';
let createdProductId = '';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const passwordHash = await bcrypt.hash('123456', 10);
  
  // Cleanup test users & products
  await User.deleteMany({ phone: { $regex: /^0998/ } });
  await Product.deleteMany({ name: { $regex: /^\[TEST\]/ } });

  // Create User 1
  const user1 = await User.create({
    name: 'Mẹ Test Seller',
    phone: '0998111222',
    passwordHash,
    xuBalance: 50,
  });
  userId = user1._id.toString();

  // Create User 2
  const user2 = await User.create({
    name: 'Mẹ Test Buyer',
    phone: '0998333444',
    passwordHash,
    xuBalance: 50,
  });
  otherUserId = user2._id.toString();

  // Login User 1
  const loginRes1 = await request(app).post('/api/auth/login').send({ phone: '0998111222', password: '123456' });
  userToken = loginRes1.body.accessToken;

  // Login User 2
  const loginRes2 = await request(app).post('/api/auth/login').send({ phone: '0998333444', password: '123456' });
  otherUserToken = loginRes2.body.accessToken;
});

afterAll(async () => {
  await User.deleteMany({ phone: { $regex: /^0998/ } });
  await Product.deleteMany({ name: { $regex: /^\[TEST\]/ } });
  await mongoose.connection.close();
});

describe('📦 Products API Full Test Suite', () => {
  describe('1. Create Product (POST /api/products)', () => {
    it('Đăng sản phẩm mới thành công với SafeFee = 10%', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: '[TEST] Xe đẩy Combi gấp gọn siêu nhẹ cho bé',
          description: 'Xe đẩy Nhật Bản còn rất mới, đầy đủ phụ kiện cho bé',
          price: 15,
          category: 'xe_day',
          condition: '90',
          conditionLabel: 'Mới 90%',
          locationName: 'Quận Hải Châu, Đà Nẵng',
          districtId: 'dn_haichau',
          wardId: 'hc_thachthang',
          image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
        });

      expect(res.status).toBe(201);
      expect(res.body.product).toBeDefined();
      expect(res.body.product.name).toContain('Xe đẩy Combi');
      expect(res.body.product.price).toBe(15);
      createdProductId = res.body.product._id;
    });

    it('Lỗi 400 khi thiếu thông tin bắt buộc (name, price, category)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Thiếu tên và giá',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('Lỗi 401 khi không đăng nhập', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: '[TEST] Không có token',
          price: 10,
          category: 'do_choi',
          condition: '80',
          conditionLabel: 'Mới 80%',
          locationName: 'Đà Nẵng',
          image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
          description: 'Mô tả hợp lệ nhưng không có token',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('2. Get Products & Filter (GET /api/products)', () => {
    it('Lấy danh sách sản phẩm có phân trang', async () => {
      const res = await request(app).get('/api/products?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.pagination.total).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    it('Lọc sản phẩm theo danh mục (?category=xe_day)', async () => {
      const res = await request(app).get('/api/products?category=xe_day');
      expect(res.status).toBe(200);
      const allMatching = res.body.products.every((p: any) => p.category === 'xe_day');
      expect(allMatching).toBe(true);
    });

    it('Lọc sản phẩm theo khoảng giá (?minPrice=10&maxPrice=20)', async () => {
      const res = await request(app).get('/api/products?minPrice=10&maxPrice=20');
      expect(res.status).toBe(200);
      const allInRange = res.body.products.every((p: any) => p.price >= 10 && p.price <= 20);
      expect(allInRange).toBe(true);
    });

    it('Tìm kiếm sản phẩm theo từ khóa (?search=Combi)', async () => {
      const res = await request(app).get('/api/products?search=Combi');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Product Detail & Phone Masking (GET /api/products/:id)', () => {
    it('Xem chi tiết sản phẩm và xác nhận SĐT seller bị mask khi viewer là người khác', async () => {
      const res = await request(app)
        .get(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.product._id).toBe(createdProductId);
      if (res.body.product.sellerPhone) {
        expect(res.body.product.sellerPhone).toMatch(/\*{3,}/);
      }
    });

    it('Lấy danh sách sản phẩm của tôi (GET /api/products/my)', async () => {
      const res = await request(app)
        .get('/api/products/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.products)).toBe(true);
      const myProduct = res.body.products.find((p: any) => p._id === createdProductId);
      expect(myProduct).toBeDefined();
    });
  });

  describe('4. Update Product (PUT /api/products/:id)', () => {
    it('Chủ sở hữu cập nhật sản phẩm thành công', async () => {
      const res = await request(app)
        .put(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: '[TEST] Xe đẩy Combi Cập Nhật Tên',
          description: 'Mô tả mới được cập nhật chi tiết hơn',
        });

      expect(res.status).toBe(200);
      expect(res.body.product.name).toContain('Cập Nhật Tên');
    });

    it('Lỗi 403 khi người khác cố gắng sửa sản phẩm', async () => {
      const res = await request(app)
        .put(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          name: '[TEST] Hack sản phẩm',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/quyền/i);
    });
  });

  describe('5. Delete Product (DELETE /api/products/:id)', () => {
    it('Lỗi 403 khi người khác cố xóa sản phẩm', async () => {
      const res = await request(app)
        .delete(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });

    it('Chủ sở hữu xóa sản phẩm thành công và được hoàn lại SafeFee', async () => {
      const res = await request(app)
        .delete(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/xóa/i);
    });
  });
});
