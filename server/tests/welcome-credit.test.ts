// server/tests/welcome-credit.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { createTestUser, createTestProduct } from './testHelpers';
import { User } from '../src/models/User';

const app = createApp();

describe('Welcome Credit Priority & Non-Withdrawable Quarantine Tests', () => {
  it('spends welcome credit first, then real Xu, and credits seller as welcome credit', async () => {
    const { user: seller } = await createTestUser({ xuBalance: 20, welcomeCreditRemaining: 0 });
    const product = await createTestProduct(seller._id, { price: 15, safeFeeLocked: 2 });
    // Buyer has 20 Xu total: 10 Welcome Credit + 10 Real Xu
    const { user: buyer, token: buyerToken } = await createTestUser({
      xuBalance: 20,
      welcomeCreditRemaining: 10,
    });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    expect(createRes.status).toBe(201);
    const tx = createRes.body.transaction;
    // Price = 15: 10 welcome credit + 5 real xu
    expect(tx.buyerPromoXu).toBe(10);

    const buyerAfter = await User.findById(buyer._id);
    expect(buyerAfter?.xuBalance).toBe(5); // 20 - 15 = 5
    expect(buyerAfter?.welcomeCreditRemaining).toBe(0); // all 10 used

    // Complete transaction
    const txId = tx._id || tx.id;
    await request(app)
      .post(`/api/transactions/${txId}/complete`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send();

    const sellerAfter = await User.findById(seller._id);
    // Seller balance: 20 initial + 15 price + 2 safe fee = 37
    expect(sellerAfter?.xuBalance).toBe(37);
    // Seller welcomeCreditRemaining received 10 promo Xu
    expect(sellerAfter?.welcomeCreditRemaining).toBe(10);
  });
});
