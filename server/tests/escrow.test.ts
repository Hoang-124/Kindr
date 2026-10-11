// server/tests/escrow.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { createTestUser, createTestProduct } from './testHelpers';
import { Transaction } from '../src/models/Transaction';
import { User } from '../src/models/User';
import { Product } from '../src/models/Product';

const app = createApp();

describe('Escrow & Money Flow Integration Tests', () => {
  it('should successfully create escrow and deduct buyer balance & lock seller fee', async () => {
    const { user: seller } = await createTestUser({ xuBalance: 20 });
    const product = await createTestProduct(seller._id, { price: 10, safeFeeLocked: 1 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 20, welcomeCreditRemaining: 5 });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.transaction).toBeDefined();
    expect(res.body.transaction.status).toBe('awaiting_handover');
    expect(res.body.transaction.buyerPromoXu).toBe(5);

    // Verify buyer balances
    const updatedBuyer = await User.findById(buyer._id);
    expect(updatedBuyer?.xuBalance).toBe(10); // 20 - 10
    expect(updatedBuyer?.welcomeCreditRemaining).toBe(0); // 5 promo used

    // Verify product locked in escrow
    const updatedProd = await Product.findById(product._id);
    expect(updatedProd?.status).toBe('escrow');
  });

  it('should reject escrow creation when buyer has insufficient balance', async () => {
    const { user: seller } = await createTestUser({ xuBalance: 20 });
    const product = await createTestProduct(seller._id, { price: 50 });
    const { token: poorBuyerToken } = await createTestUser({ xuBalance: 10 });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${poorBuyerToken}`)
      .send({ productId: product._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/không đủ Xu/i);
  });

  it('should finalize transaction, release Xu to seller, and return SafeFee', async () => {
    const { user: seller } = await createTestUser({ xuBalance: 20, welcomeCreditRemaining: 0 });
    const product = await createTestProduct(seller._id, { price: 10, safeFeeLocked: 1 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 20, welcomeCreditRemaining: 2 });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    // Buyer completes transaction
    const completeRes = await request(app)
      .post(`/api/transactions/${txId}/complete`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send();

    expect(completeRes.status).toBe(200);

    const updatedSeller = await User.findById(seller._id);
    // Seller receives: 10 price + 1 safeFee refund = 20 + 10 + 1 = 31 xuBalance
    expect(updatedSeller?.xuBalance).toBe(31);
    expect(updatedSeller?.welcomeCreditRemaining).toBe(2);

    const updatedTx = await Transaction.findById(txId);
    expect(updatedTx?.status).toBe('completed');
  });

  it('should prevent seller from buying their own product (400)', async () => {
    const { user: seller, token: sellerToken } = await createTestUser({ xuBalance: 50 });
    const product = await createTestProduct(seller._id, { price: 10 });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ productId: product._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/không thể tự mua|chính mình/i);
  });

  it('should safely handle 10 concurrent purchases of the same single product, ensuring exactly 1 succeeds', async () => {
    const { user: seller } = await createTestUser({ xuBalance: 20 });
    const product = await createTestProduct(seller._id, { price: 10 });

    const buyers = await Promise.all(
      Array.from({ length: 10 }, () => createTestUser({ xuBalance: 20 }))
    );

    const responses = await Promise.all(
      buyers.map(({ token }) =>
        request(app)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${token}`)
          .send({ productId: product._id.toString() })
      )
    );

    const successResponses = responses.filter(r => r.status === 201);
    const failureResponses = responses.filter(r => r.status === 400 || r.status === 409);

    expect(successResponses.length).toBe(1);
    expect(failureResponses.length).toBe(9);

    // Verify exactly 1 transaction was created
    const txCount = await Transaction.countDocuments({ productId: product._id });
    expect(txCount).toBe(1);

    // Verify product status is 'escrow'
    const updatedProd = await Product.findById(product._id);
    expect(updatedProd?.status).toBe('escrow');
  });
});
