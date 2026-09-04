// server/src/__tests__/auth_full.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { ENV } from '../config/env';

const app = createApp();

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }
  // Setup locked user for testing
  const passwordHash = await bcrypt.hash('123456', 10);
  await User.deleteOne({ phone: '0988000888' });
  await User.create({
    name: 'Tài Khoản Bị Khóa',
    phone: '0988000888',
    passwordHash,
    isLocked: true,
    lockReason: 'Vi phạm quy tắc 3 strikes',
  });
});

afterAll(async () => {
  await User.deleteMany({ phone: { $regex: /^0988/ } });
  await mongoose.connection.close();
});

describe('🔐 Auth API Full Test Suite', () => {
  const validPhone = '0988123456';
  const validPassword = 'Password123!';
  let accessToken = '';
  let refreshToken = '';

  describe('1. Registration (POST /api/auth/register)', () => {
    it('Đăng ký thành công và nhận 10 Xu Welcome Credit', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mẹ Test Register',
          phone: validPhone,
          password: validPassword,
          email: 'testauth@outlook.com',
          districtId: 'dn_haichau',
          districtName: 'Quận Hải Châu',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.phone).toBe(validPhone);
      expect(res.body.user.xuBalance).toBe(10);
      expect(res.body.user.welcomeCreditRemaining).toBe(10);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('Lỗi 400 khi đăng ký bằng email Gmail trên form truyền thống', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mẹ Test Gmail Block',
          phone: '0988111999',
          password: validPassword,
          email: 'mom_trying_gmail@gmail.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Gmail/i);
    });

    it('Lỗi 409 khi đăng ký số điện thoại đã tồn tại', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mẹ Test Duplicate Phone',
          phone: validPhone,
          password: validPassword,
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/đã được đăng ký/i);
    });

    it('Lỗi 409 khi đăng ký email đã tồn tại', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mẹ Test Duplicate Email',
          phone: '0988222333',
          password: validPassword,
          email: 'testauth@outlook.com',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/email này đã được đăng ký/i);
    });

    it('Lỗi 400 khi thiếu trường bắt buộc', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          phone: '0988888777',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('Lỗi 400 khi số điện thoại sai định dạng', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mẹ Test Format',
          phone: '123456',
          password: validPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Số điện thoại/i);
    });

    it('Lỗi 400 khi mật khẩu quá ngắn (< 6 ký tự)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Mẹ Test Short Pass',
          phone: '0988777666',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Mật khẩu/i);
    });
  });

  describe('2. Login (POST /api/auth/login)', () => {
    it('Đăng nhập thành công trả về access & refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          phone: validPhone,
          password: validPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.phone).toBe(validPhone);

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('Lỗi 401 khi sai mật khẩu', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          phone: validPhone,
          password: 'WrongPassword999',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/không đúng|không chính xác/i);
    });

    it('Lỗi 401 khi số điện thoại không tồn tại', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '0988000111',
          password: validPassword,
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/không đúng|không chính xác|không tồn tại/i);
    });

    it('Lỗi 403 khi tài khoản bị khóa', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '0988000888',
          password: '123456',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/bị khóa/i);
    });
  });

  describe('3. Token Refresh (POST /api/auth/refresh)', () => {
    it('Lấy accessToken mới thành công từ refreshToken hợp lệ', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('Lỗi 401 khi refreshToken không hợp lệ', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.string' });

      expect(res.status).toBe(401);
    });
  });

  describe('4. Current User Info (GET /api/auth/me)', () => {
    it('Lấy thông tin cá nhân với Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.phone).toBe(validPhone);
    });

    it('Lỗi 401 khi không gửi token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('5. Logout (POST /api/auth/logout)', () => {
    it('Đăng xuất thành công và vô hiệu hóa refreshToken', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/đăng xuất|thành công/i);
    });
  });

  describe('6. Update Profile (PUT /api/auth/profile)', () => {
    let testToken: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: validPhone, password: validPassword });
      testToken = res.body.accessToken;
    });

    it('Cập nhật tên, bio, địa chỉ thành công', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Mẹ Bỉm Đà Nẵng Mới',
          bio: 'Chuyên chia sẻ đồ chơi gỗ Montessori',
          districtId: 'dn_haichau',
          districtName: 'Quận Hải Châu',
          addressDetail: '123 Bạch Đằng',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Mẹ Bỉm Đà Nẵng Mới');
      expect(res.body.user.bio).toBe('Chuyên chia sẻ đồ chơi gỗ Montessori');
      expect(res.body.user.location.districtName).toBe('Quận Hải Châu');
    });

    it('Lỗi 400 khi tên quá ngắn (< 2 ký tự)', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'A' });

      expect(res.status).toBe(400);
    });
  });

  describe('7. Change Password (PUT /api/auth/change-password)', () => {
    let testToken: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: validPhone, password: validPassword });
      testToken = res.body.accessToken;
    });

    it('Lỗi 400 khi sai mật khẩu hiện tại', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ oldPassword: 'wrongpassword', newPassword: 'newpassword123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/không đúng/i);
    });

    it('Đổi mật khẩu thành công và đăng nhập được bằng mật khẩu mới', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ oldPassword: validPassword, newPassword: 'brandNewPassword123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/thành công/i);

      // Verify login with new password works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ phone: validPhone, password: 'brandNewPassword123' });

      expect(loginRes.status).toBe(200);
    });
  });

  describe('8. Admin Access & Role Management', () => {
    let adminToken: string;
    let targetUserId: string;

    beforeAll(async () => {
      // Create or login user with admin email
      const res = await request(app)
        .post('/api/auth/google')
        .send({
          email: 'admin@kindr.vn',
          name: 'Super Admin Kindr',
          googleId: 'google_admin_test_123',
        });
      adminToken = res.body.accessToken;

      const target = await User.findOne({ phone: validPhone });
      targetUserId = target?._id.toString() || '';
    });

    it('Tài khoản email admin tự động nhận quyền admin và truy cập được admin dashboard', async () => {
      const adminRes = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(200);
    });

    it('Chỉ Admin mới có thể phân quyền admin cho người dùng khác (PUT /api/admin/users/:id/role)', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
    });
  });
});
