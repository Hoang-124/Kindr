// server/tests/handover.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { createTestUser, createTestProduct } from './testHelpers';
import { Transaction } from '../src/models/Transaction';

const app = createApp();

describe('Handover PIN & QR Flow Tests', () => {
  it('should only expose handoverCode to the buyer, never to seller or public', async () => {
    const { user: seller, token: sellerToken } = await createTestUser();
    const product = await createTestProduct(seller._id, { price: 10 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 30 });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    // Buyer fetches transaction -> sees handoverCode
    const buyerGet = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(buyerGet.status).toBe(200);
    expect(buyerGet.body.transaction.handoverCode).toBeDefined();
    expect(buyerGet.body.transaction.handoverCode).toHaveLength(6);

    // Seller fetches transaction -> handoverCode is hidden/undefined
    const sellerGet = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(sellerGet.status).toBe(200);
    expect(sellerGet.body.transaction.handoverCode).toBeUndefined();
  });

  it('seller fails with wrong PIN and succeeds with correct PIN', async () => {
    const { user: seller, token: sellerToken } = await createTestUser();
    const product = await createTestProduct(seller._id, { price: 10 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 30 });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;
    const rawTx = await Transaction.findById(txId);
    const validPin = rawTx?.handoverCode;

    // Seller tries wrong PIN
    const wrongRes = await request(app)
      .post(`/api/transactions/${txId}/handover`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ handoverCode: 'WRONG1' });

    expect(wrongRes.status).toBe(400);
    expect(wrongRes.body.error).toMatch(/mã xác nhận bàn giao không chính xác/i);

    // Seller provides correct PIN
    const correctRes = await request(app)
      .post(`/api/transactions/${txId}/handover`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ handoverCode: validPin });

    expect(correctRes.status).toBe(200);
    const updatedTx = await Transaction.findById(txId);
    expect(updatedTx?.status).toBe('in_safeful_time');
    expect(updatedTx?.safefulTimeExpiresAt).toBeDefined();
  });

  it('buyer can self-confirm handover without entering PIN', async () => {
    const { user: seller } = await createTestUser();
    const product = await createTestProduct(seller._id, { price: 10 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 30 });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    // Buyer self-confirms
    const res = await request(app)
      .post(`/api/transactions/${txId}/handover`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({});

    expect(res.status).toBe(200);
    const updatedTx = await Transaction.findById(txId);
    expect(updatedTx?.status).toBe('in_safeful_time');
  });

  it('seller is blocked after exceeding 5 failed attempts', async () => {
    const { user: seller, token: sellerToken } = await createTestUser();
    const product = await createTestProduct(seller._id, { price: 10 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 30 });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    // Fail 5 times
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`/api/transactions/${txId}/handover`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ handoverCode: `FAIL0${i}` });
    }

    // 6th attempt should be blocked
    const blockedRes = await request(app)
      .post(`/api/transactions/${txId}/handover`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ handoverCode: 'ANYPIN' });

    expect(blockedRes.status).toBe(400);
    expect(blockedRes.body.error).toMatch(/quá 5 lần/i);
  });

  it('seller fails with 400 when handoverCode is missing in request', async () => {
    const { user: seller, token: sellerToken } = await createTestUser();
    const product = await createTestProduct(seller._id, { price: 10 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 30 });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    const res = await request(app)
      .post(`/api/transactions/${txId}/handover`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/mã nhận hàng|mã giao nhận|handoverCode/i);
  });
});
