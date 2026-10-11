// server/tests/wallet.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { createTestUser } from './testHelpers';
import { TopupOrder } from '../src/models/TopupOrder';
import { User } from '../src/models/User';
import { ENV } from '../src/config/env';

const app = createApp();

describe('Wallet Topup Webhook & Withdraw CAS Tests', () => {
  it('should create topup order and verify webhook with secret and amount', async () => {
    const { user, token } = await createTestUser({ xuBalance: 10 });

    // 1. Create topup order
    const orderRes = await request(app)
      .post('/api/wallet/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ xuAmount: 5 });

    expect(orderRes.status).toBe(201);
    const { orderCode: transferContent, vndAmount } = orderRes.body.order;
    expect(vndAmount).toBe(50000); // 5 Xu * 10,000

    // 2. Webhook without secret should be rejected
    const unauthWebhook = await request(app)
      .post('/api/wallet/webhook')
      .send({ orderCode: transferContent, amount: 50000 });
    expect(unauthWebhook.status).toBe(401);

    // 3. Webhook with insufficient amount should be rejected
    const underpaidWebhook = await request(app)
      .post('/api/wallet/webhook')
      .set('x-webhook-secret', ENV.WEBHOOK_SECRET)
      .send({ orderCode: transferContent, amount: 20000 });
    expect(underpaidWebhook.status).toBe(400);

    // 4. Valid Webhook
    const validWebhook = await request(app)
      .post('/api/wallet/webhook')
      .set('x-webhook-secret', ENV.WEBHOOK_SECRET)
      .send({ orderCode: transferContent, amount: 50000 });
    expect(validWebhook.status).toBe(200);

    // Verify user balance credited
    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.xuBalance).toBe(15); // 10 + 5

    // 5. Replay attack prevention: second webhook should not credit again
    const replayWebhook = await request(app)
      .post('/api/wallet/webhook')
      .set('x-webhook-secret', ENV.WEBHOOK_SECRET)
      .send({ orderCode: transferContent, amount: 50000 });
    expect(replayWebhook.status).toBe(200);

    const recheckUser = await User.findById(user._id);
    expect(recheckUser?.xuBalance).toBe(15); // Still 15, no double credit
  });

  it('withdraw should protect against overdraft and lock 10% fee', async () => {
    const { user, token } = await createTestUser({ xuBalance: 30, xuFrozen: 0 });

    // 1. Attempt to withdraw more than balance
    const overRes = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({
        xuAmount: 40,
        bankName: 'MB Bank',
        accountNumber: '0901234567',
        accountHolder: 'NGUYEN VAN A',
      });
    expect(overRes.status).toBe(400);
    expect(overRes.body.error).toMatch(/không đủ/i);

    // 2. Valid withdrawal
    const validRes = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({
        xuAmount: 20,
        bankName: 'MB Bank',
        accountNumber: '0901234567',
        accountHolder: 'NGUYEN VAN A',
      });
    expect(validRes.status).toBe(201);
    expect(validRes.body.withdrawRequest.feeVnd).toBe(20000); // 10% of 200,000 VND
    expect(validRes.body.withdrawRequest.payoutVnd).toBe(180000);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser?.xuBalance).toBe(10); // 30 - 20
  });

  it('should block demo topup when ENABLE_DEMO_TOPUP is false or in production (403)', async () => {
    const { token } = await createTestUser({ xuBalance: 10 });
    const originalEnable = ENV.ENABLE_DEMO_TOPUP;
    try {
      (ENV as any).ENABLE_DEMO_TOPUP = false;

      const res = await request(app)
        .post('/api/wallet/topup')
        .set('Authorization', `Bearer ${token}`)
        .send({ xuAmount: 10 });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/demo/i);
    } finally {
      (ENV as any).ENABLE_DEMO_TOPUP = originalEnable;
    }
  });

  it('should reject webhook when amount is missing or <= 0 (400)', async () => {
    const { token } = await createTestUser();
    const orderRes = await request(app)
      .post('/api/wallet/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({ xuAmount: 5 });

    const { orderCode } = orderRes.body.order;

    const res = await request(app)
      .post('/api/wallet/webhook')
      .set('x-webhook-secret', ENV.WEBHOOK_SECRET)
      .send({ orderCode, amount: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/không hợp lệ/i);
  });

  it('should prevent withdrawal of promotional welcome credit (non-withdrawable)', async () => {
    // User has 10 Xu total, but 10 Xu is welcome credit -> withdrawable is 0!
    const { token } = await createTestUser({ xuBalance: 10, welcomeCreditRemaining: 10 });

    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({
        xuAmount: 5,
        bankName: 'MB Bank',
        accountNumber: '0901234567',
        accountHolder: 'TEST PROMO',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/chào mừng|không thể rút/i);
  });

  it('should safely handle 5 concurrent withdraw requests: exactly 1 succeeds when balance allows only 1', async () => {
    // User has 20 Xu real balance. 5 concurrent requests of 20 Xu.
    const { user, token } = await createTestUser({ xuBalance: 20, welcomeCreditRemaining: 0 });

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/wallet/withdraw')
          .set('Authorization', `Bearer ${token}`)
          .send({
            xuAmount: 20,
            bankName: 'MB Bank',
            accountNumber: '0901234567',
            accountHolder: 'NGUYEN VAN A',
          })
      )
    );

    const successList = responses.filter(r => r.status === 201);
    const failList = responses.filter(r => r.status === 400);

    expect(successList.length).toBe(1);
    expect(failList.length).toBe(4);

    const updated = await User.findById(user._id);
    expect(updated?.xuBalance).toBe(0); // Deducted exactly once, no negative balance!
  });
});
