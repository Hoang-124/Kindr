// server/tests/auth.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/createApp';
import { createTestUser } from './testHelpers';
import { User } from '../src/models/User';
import { ENV } from '../src/config/env';

const app = createApp();

describe('Auth Security & Account Locking Tests', () => {
  it('should return user info on GET /api/auth/me', async () => {
    const { user, token } = await createTestUser();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.phone).toBe(user.phone);
  });

  it('locked user attempting refresh token should be rejected and have refreshTokens wiped', async () => {
    const refreshSecret = ENV.JWT_REFRESH_SECRET;
    const { user } = await createTestUser({
      isLocked: true,
      refreshTokens: ['valid_refresh_token_to_be_wiped'],
    });

    const validRefreshToken = jwt.sign(
      { userId: user._id.toString() },
      refreshSecret,
      { expiresIn: '7d' }
    );

    // Save refresh token to user
    user.refreshTokens = [validRefreshToken];
    await user.save();

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: validRefreshToken });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/khóa/i);

    // Verify all refresh tokens are wiped
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.refreshTokens).toHaveLength(0);
  });

  it('demo login should work in test/demo mode', async () => {
    const res = await request(app)
      .post('/api/auth/demo-login')
      .send({ phone: '0901234567' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).toBeDefined();
  });

  it('demo login should return 404 when ENABLE_DEMO_LOGIN is disabled', async () => {
    const originalEnable = ENV.ENABLE_DEMO_LOGIN;
    try {
      (ENV as any).ENABLE_DEMO_LOGIN = false;

      const res = await request(app)
        .post('/api/auth/demo-login')
        .send();

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/không khả dụng/i);
    } finally {
      (ENV as any).ENABLE_DEMO_LOGIN = originalEnable;
    }
  });
});
