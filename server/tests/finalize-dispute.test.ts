// server/tests/finalize-dispute.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { createTestUser, createTestProduct } from './testHelpers';
import { Transaction } from '../src/models/Transaction';
import { User } from '../src/models/User';
import { Product } from '../src/models/Product';

const app = createApp();

describe('Dispute & Admin Verdict Resolution Tests', () => {
  it('should allow buyer to file dispute during Safeful Time and admin resolves for buyer', async () => {
    const { user: admin, token: adminToken } = await createTestUser({ role: 'admin' });
    const { user: seller } = await createTestUser({ xuBalance: 20 });
    const product = await createTestProduct(seller._id, { price: 10, safeFeeLocked: 1 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 20, welcomeCreditRemaining: 3 });

    // 1. Create transaction & confirm handover
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    await request(app)
      .post(`/api/transactions/${txId}/handover`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({});

    // 2. Buyer files dispute
    const disputeRes = await request(app)
      .post(`/api/transactions/${txId}/dispute`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ reason: 'Sản phẩm bị gãy bánh xe không như mô tả' });

    expect(disputeRes.status).toBe(200);
    const txAfterDispute = await Transaction.findById(txId);
    expect(txAfterDispute?.status).toBe('disputed');

    // 3. Admin resolves in favor of Buyer
    const resolveRes = await request(app)
      .put(`/api/admin/disputes/${txId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ outcome: 'resolved_buyer' });

    expect(resolveRes.status).toBe(200);

    // Verify Buyer was refunded 100% (including promo restored)
    const updatedBuyer = await User.findById(buyer._id);
    expect(updatedBuyer?.xuBalance).toBe(20);
    expect(updatedBuyer?.welcomeCreditRemaining).toBe(3);

    // Verify Product status is cancelled
    const updatedProd = await Product.findById(product._id);
    expect(updatedProd?.status).toBe('cancelled');

    // Verify Transaction status is refunded
    const updatedTx = await Transaction.findById(txId);
    expect(updatedTx?.status).toBe('refunded');
  });

  it('admin resolves dispute in favor of Seller when claims are invalid', async () => {
    const { user: admin, token: adminToken } = await createTestUser({ role: 'admin' });
    const { user: seller } = await createTestUser({ xuBalance: 20 });
    const product = await createTestProduct(seller._id, { price: 10, safeFeeLocked: 1 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 20 });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    await request(app)
      .post(`/api/transactions/${txId}/handover`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({});

    await request(app)
      .post(`/api/transactions/${txId}/dispute`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ reason: 'Đổi ý không thích màu này nữa' });

    // Admin resolves in favor of Seller
    const resolveRes = await request(app)
      .put(`/api/admin/disputes/${txId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ outcome: 'resolved_seller' });

    expect(resolveRes.status).toBe(200);

    const updatedSeller = await User.findById(seller._id);
    // Seller receives price (10) + safe fee returned (1) = 20 + 10 + 1 = 31
    expect(updatedSeller?.xuBalance).toBe(31);

    const updatedTx = await Transaction.findById(txId);
    expect(updatedTx?.status).toBe('completed');
  });

  it('should be idempotent under concurrent resolutions: exactly 1 succeeds, second fails', async () => {
    const { user: admin, token: adminToken } = await createTestUser({ role: 'admin' });
    const { user: seller } = await createTestUser({ xuBalance: 20 });
    const product = await createTestProduct(seller._id, { price: 10, safeFeeLocked: 1 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 20 });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    await request(app)
      .post(`/api/transactions/${txId}/handover`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({});

    await request(app)
      .post(`/api/transactions/${txId}/dispute`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ reason: 'Hàng hỏng nặng' });

    // 2 concurrent resolution requests
    const [res1, res2] = await Promise.all([
      request(app)
        .put(`/api/admin/disputes/${txId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ outcome: 'resolved_buyer' }),
      request(app)
        .put(`/api/admin/disputes/${txId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ outcome: 'resolved_buyer' }),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(400); // Second attempt rejected as not in 'disputed' status
  });

  it('should clamp seller civilization points at >= 0 and lock account after 3 strikes', async () => {
    const { user: admin, token: adminToken } = await createTestUser({ role: 'admin' });
    // Seller starts with only 10 civilization points and 2 dispute strikes
    const { user: badSeller } = await createTestUser({
      xuBalance: 20,
      civilizationPoints: 10,
      disputeStrikeCount: 2,
    });

    const product = await createTestProduct(badSeller._id, { price: 10, safeFeeLocked: 1 });
    const { user: buyer, token: buyerToken } = await createTestUser({ xuBalance: 20 });

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    const txId = createRes.body.transaction._id || createRes.body.transaction.id;

    await request(app)
      .post(`/api/transactions/${txId}/handover`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({});

    await request(app)
      .post(`/api/transactions/${txId}/dispute`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ reason: 'Lừa đảo đồ hỏng hoàn toàn' });

    // Resolve for buyer (seller loses 15 points: 10 - 15 -> clamped to 0, strikes: 2 + 1 = 3 -> locked)
    const resolveRes = await request(app)
      .put(`/api/admin/disputes/${txId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ outcome: 'resolved_buyer' });

    expect(resolveRes.status).toBe(200);

    const updatedSeller = await User.findById(badSeller._id);
    expect(updatedSeller?.civilizationPoints).toBe(0); // Clamped at 0, not -5!
    expect(updatedSeller?.disputeStrikeCount).toBe(3);
    expect(updatedSeller?.isLocked).toBe(true); // Account locked under 3 strikes rule
  });
});
