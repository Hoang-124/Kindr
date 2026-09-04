// server/src/__tests__/webhook_banking.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { TopupOrder } from '../models/TopupOrder';
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

  testUser = await User.create({
    name: 'Mẹ Test Webhook',
    phone: '0988776655',
    passwordHash,
    xuBalance: 5,
    welcomeCreditRemaining: 5,
    civilizationPoints: 100,
  });

  authToken = jwt.sign({ userId: testUser._id.toString(), role: 'user' }, ENV.JWT_SECRET);
});

afterAll(async () => {
  await TopupOrder.deleteMany({ userId: testUser._id });
  await User.deleteMany({ phone: '0988776655' });
  await mongoose.connection.close();
});

describe('⚡ Automated Banking Webhook & Top-up IPN Tests', () => {
  let createdOrderCode = '';
  let createdOrder: any;

  it('1. POST /api/wallet/create-order → should create a pending TopupOrder with dynamic VietQR', async () => {
    const res = await request(app)
      .post('/api/wallet/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ xuAmount: 20 });

    expect(res.status).toBe(201);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.orderCode).toMatch(/^TOPUP_\d+_[A-Z0-9]+/);
    expect(res.body.order.xuAmount).toBe(20);
    expect(res.body.order.vndAmount).toBe(200000);
    expect(res.body.order.vietqrUrl).toContain('vietqr.io');
    expect(res.body.order.status).toBe('pending');

    createdOrderCode = res.body.order.orderCode;
    createdOrder = res.body.order;
  });

  it('2. GET /api/wallet/orders/:orderCode/status → should return pending status', async () => {
    const res = await request(app)
      .get(`/api/wallet/orders/${createdOrderCode}/status`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.orderCode).toBe(createdOrderCode);
    expect(res.body.status).toBe('pending');
    expect(res.body.xuAmount).toBe(20);
  });

  it('3. POST /api/wallet/webhook → should reject unauthorized requests without valid secret', async () => {
    const res = await request(app)
      .post('/api/wallet/webhook')
      .set('x-webhook-secret', 'wrong_secret')
      .send({
        content: `CHUYEN TIEN ${createdOrderCode}`,
        transferAmount: 200000,
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('secret không hợp lệ');
  });

  it('4. POST /api/wallet/webhook → should reject if transfer amount is insufficient', async () => {
    const res = await request(app)
      .post('/api/wallet/webhook')
      .set('x-webhook-secret', ENV.WEBHOOK_SECRET)
      .send({
        gateway: 'sepay',
        content: `KINDR NAP 20XU ${createdOrderCode}`,
        transferAmount: 50000, // Order is 200000, only transferred 50000
        referenceCode: 'SEP_UNDERPAID',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('không đủ');

    // Balance should remain unchanged
    const user = await User.findById(testUser._id);
    expect(user?.xuBalance).toBe(5);
  });

  it('5. POST /api/wallet/webhook → should process SePay format and credit Xu atomically', async () => {
    const res = await request(app)
      .post('/api/wallet/webhook')
      .set('x-webhook-secret', ENV.WEBHOOK_SECRET)
      .send({
        gateway: 'sepay',
        content: `KINDR NAP 20XU ${createdOrderCode}`,
        transferAmount: 200000,
        referenceCode: 'SEP_SUCCESS_123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('completed');
    expect(res.body.order.gatewayName).toBe('sepay');

    // User balance should have increased by 20 Xu (5 + 20 = 25)
    const user = await User.findById(testUser._id);
    expect(user?.xuBalance).toBe(25);
  });

  it('6. POST /api/wallet/webhook → should be IDEMPOTENT and not double-credit Xu', async () => {
    const res = await request(app)
      .post('/api/wallet/webhook')
      .set('x-webhook-secret', ENV.WEBHOOK_SECRET)
      .send({
        gateway: 'sepay',
        content: `KINDR NAP 20XU ${createdOrderCode}`,
        transferAmount: 200000,
        referenceCode: 'SEP_SUCCESS_123_RETRY',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('idempotent');

    // User balance should STILL be 25 Xu
    const user = await User.findById(testUser._id);
    expect(user?.xuBalance).toBe(25);
  });

  it('7. POST /api/wallet/webhook → should process Casso format webhook for another order', async () => {
    // Create second order for Casso
    const orderRes = await request(app)
      .post('/api/wallet/create-order')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ xuAmount: 10 });

    const cassoOrderCode = orderRes.body.order.orderCode;

    // Send Casso payload
    const webhookRes = await request(app)
      .post('/api/wallet/webhook')
      .set('x-webhook-secret', ENV.WEBHOOK_SECRET)
      .send({
        error: 0,
        data: [
          {
            id: 99999,
            tid: 'CASSO_TX_888',
            description: `MBVCB.12345.${cassoOrderCode}.CT tu NGUYEN VAN A`,
            amount: 100000,
          },
        ],
      });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);
    expect(webhookRes.body.order.status).toBe('completed');
    expect(webhookRes.body.order.gatewayName).toBe('casso');

    // User balance should have increased by 10 Xu (25 + 10 = 35)
    const user = await User.findById(testUser._id);
    expect(user?.xuBalance).toBe(35);
  });
});
