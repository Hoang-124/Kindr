// server/tests/payos-topup.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { createTestUser } from './testHelpers';
import { PaymentOrder } from '../src/models/PaymentOrder';
import { User } from '../src/models/User';

const app = createApp();

describe('PayOS VietQR Topup Flow Tests', () => {
  it('should create PayOS topup order with correct 1 Xu = 1.000 VNĐ rate', async () => {
    const { user, token } = await createTestUser({ xuBalance: 20 });

    const res = await request(app)
      .post('/api/wallet/topup/create-link')
      .set('Authorization', `Bearer ${token}`)
      .send({ xuAmount: 50 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.xuAmount).toBe(50);
    expect(res.body.vndAmount).toBe(50000); // 50 * 1000
    expect(res.body.status).toBe('PENDING');
    expect(res.body.orderCode).toBeTypeOf('number');
    expect(res.body.qrCode).toBeDefined();

    const orderInDb = await PaymentOrder.findOne({ orderCode: res.body.orderCode });
    expect(orderInDb).toBeDefined();
    expect(orderInDb?.status).toBe('PENDING');
    expect(orderInDb?.vndAmount).toBe(50000);
  });

  it('should validate minimum xuAmount >= 10', async () => {
    const { token } = await createTestUser();

    const res = await request(app)
      .post('/api/wallet/topup/create-link')
      .set('Authorization', `Bearer ${token}`)
      .send({ xuAmount: 5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('tối thiểu là 10 Xu');
  });

  it('should retrieve status of pending order', async () => {
    const { token } = await createTestUser();

    const createRes = await request(app)
      .post('/api/wallet/topup/create-link')
      .set('Authorization', `Bearer ${token}`)
      .send({ xuAmount: 100 });

    const orderCode = createRes.body.orderCode;

    const res = await request(app)
      .get(`/api/wallet/topup/status/${orderCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.orderCode).toBe(orderCode);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.xuAmount).toBe(100);
    expect(res.body.vndAmount).toBe(100000);
  });

  it('should simulate successful payment, credit Xu atomically, and guarantee idempotency', async () => {
    const { user, token } = await createTestUser({ xuBalance: 20 });
    const initialBalance = user.xuBalance;

    const createRes = await request(app)
      .post('/api/wallet/topup/create-link')
      .set('Authorization', `Bearer ${token}`)
      .send({ xuAmount: 50 });

    const orderCode = createRes.body.orderCode;

    // First completion
    const res1 = await request(app)
      .post(`/api/wallet/topup/simulate-success/${orderCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.newBalance).toBe(initialBalance + 50);

    const userAfter = await User.findById(user._id);
    expect(userAfter?.xuBalance).toBe(initialBalance + 50);

    const orderAfter = await PaymentOrder.findOne({ orderCode });
    expect(orderAfter?.status).toBe('PAID');
    expect(orderAfter?.paidAt).toBeDefined();

    // Idempotency: calling again MUST NOT credit Xu a second time
    const res2 = await request(app)
      .post(`/api/wallet/topup/simulate-success/${orderCode}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res2.status).toBe(200);

    const userFinal = await User.findById(user._id);
    expect(userFinal?.xuBalance).toBe(initialBalance + 50); // Exact same, no double-credit!
  });

  it('should allow user to cancel a pending order', async () => {
    const { token } = await createTestUser();

    const createRes = await request(app)
      .post('/api/wallet/topup/create-link')
      .set('Authorization', `Bearer ${token}`)
      .send({ xuAmount: 20 });

    expect(createRes.status).toBe(201);
    const orderToCancel = createRes.body.orderCode;

    const cancelRes = await request(app)
      .post(`/api/wallet/topup/cancel/${orderToCancel}`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe('CANCELLED');

    const dbOrder = await PaymentOrder.findOne({ orderCode: orderToCancel });
    expect(dbOrder?.status).toBe('CANCELLED');
  });

  it('should return payosOrders in GET /api/wallet/history', async () => {
    const { token } = await createTestUser();

    await request(app)
      .post('/api/wallet/topup/create-link')
      .set('Authorization', `Bearer ${token}`)
      .send({ xuAmount: 20 });

    const res = await request(app)
      .get('/api/wallet/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.payosOrders).toBeDefined();
    expect(Array.isArray(res.body.payosOrders)).toBe(true);
    expect(res.body.payosOrders.length).toBeGreaterThanOrEqual(1);
  });
});
