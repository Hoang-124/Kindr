// server/tests/ratings.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { createTestUser, createTestProduct } from './testHelpers';
import { User } from '../src/models/User';
import { Transaction } from '../src/models/Transaction';

const app = createApp();

describe('Ratings & Civilization Reputation Tests', () => {
  it('should allow buyer to rate seller on completed transaction and prevent duplicate rating', async () => {
    const { user: seller } = await createTestUser({ civilizationPoints: 80 });
    const product = await createTestProduct(seller._id, { price: 10 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 20 });

    // Complete a transaction
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    await request(app)
      .post(`/api/transactions/${txId}/complete`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send();

    // 1. Submit 5-star rating
    const rateRes = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        transactionId: txId,
        stars: 5,
        comment: 'Đồ dùng rất sạch đẹp, mẹ bỉm nhiệt tình!',
        tags: ['Đồ mới đúng mô tả'],
      });

    expect(rateRes.status).toBe(201);

    // Verify partner civilization points increased: 80 + 5 = 85
    const updatedSeller = await User.findById(seller._id);
    expect(updatedSeller?.civilizationPoints).toBe(85);

    // 2. Second rating attempt by the same buyer must be blocked
    const duplicateRate = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        transactionId: txId,
        stars: 5,
        comment: 'Đánh giá lần 2',
      });

    expect(duplicateRate.status).toBe(400);
    expect(duplicateRate.body.error).toMatch(/đã đánh giá/i);
  });

  it('civilization points must be clamped between 0 and 100', async () => {
    const { user: seller } = await createTestUser({ civilizationPoints: 98 });
    const product = await createTestProduct(seller._id, { price: 10 });
    const { token: buyerToken } = await createTestUser({ xuBalance: 20 });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    await request(app)
      .post(`/api/transactions/${txId}/complete`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send();

    // 5 stars gives +5, 98 + 5 = 103 -> should be clamped to 100
    await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        transactionId: txId,
        stars: 5,
      });

    const updatedSeller = await User.findById(seller._id);
    expect(updatedSeller?.civilizationPoints).toBe(100);
  });

  it('should safely handle concurrent duplicate rating submissions: exactly 1 succeeds', async () => {
    const { user: seller } = await createTestUser({ civilizationPoints: 80 });
    const product = await createTestProduct(seller._id, { price: 10 });
    const { token: buyerToken } = await createTestUser({ xuBalance: 20 });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    await request(app)
      .post(`/api/transactions/${txId}/complete`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send();

    // 2 concurrent rating requests from the same buyer
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ transactionId: txId, stars: 5, comment: 'Đánh giá 1' }),
      request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ transactionId: txId, stars: 5, comment: 'Đánh giá 2' }),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(400);

    const updatedSeller = await User.findById(seller._id);
    expect(updatedSeller?.civilizationPoints).toBe(85); // Only credited once!
  });
});
