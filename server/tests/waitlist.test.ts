// server/tests/waitlist.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { Waitlist } from '../src/models/Waitlist';
import { Counter } from '../src/models/Counter';
import { User } from '../src/models/User';

const app = createApp();

describe('Waitlist API & Founding Member 5 Xu Claim Tests', () => {
  it('should validate email, consent, and userRole strictly (400 bad request)', async () => {
    // Missing email
    const res1 = await request(app)
      .post('/api/waitlist')
      .send({ consent: true, userRole: 'mom' });
    expect(res1.status).toBe(400);

    // Invalid email
    const res2 = await request(app)
      .post('/api/waitlist')
      .send({ email: 'not-an-email', consent: true, userRole: 'mom' });
    expect(res2.status).toBe(400);

    // Consent false or missing
    const res3 = await request(app)
      .post('/api/waitlist')
      .send({ email: 'valid@example.com', consent: false, userRole: 'mom' });
    expect(res3.status).toBe(400);

    // Invalid userRole
    const res4 = await request(app)
      .post('/api/waitlist')
      .send({ email: 'valid@example.com', consent: true, userRole: 'admin' });
    expect(res4.status).toBe(400);
  });

  it('should register first waitlist member as Founding Member #1 with 5 Xu promised', async () => {
    const res = await request(app)
      .post('/api/waitlist')
      .send({
        email: 'founder.mom@kindr.vn',
        phone: '0905123456',
        userRole: 'mom',
        interest: 'Đồ chơi vận động',
        consent: true
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.orderNumber).toBe(1);
    expect(res.body.foundingMember).toBe(true);
    expect(res.body.total).toBe(1);
    expect(res.body.remaining).toBe(199);

    const doc = await Waitlist.findOne({ email: 'founder.mom@kindr.vn' });
    expect(doc).not.toBeNull();
    expect(doc?.orderNumber).toBe(1);
    expect(doc?.foundingMember).toBe(true);
    expect(doc?.xuClaimed).toBe(false);
  });

  it('should safely handle 20 concurrent waitlist registrations with zero orderNumber collisions', async () => {
    const emails = Array.from({ length: 20 }, (_, i) => `concurrent.mom.${i + 2}@kindr.vn`);

    const responses = await Promise.all(
      emails.map(email =>
        request(app)
          .post('/api/waitlist')
          .send({
            email,
            userRole: 'mom',
            consent: true
          })
      )
    );

    responses.forEach(r => {
      expect(r.status).toBe(201);
      expect(r.body.success).toBe(true);
      expect(r.body.orderNumber).toBeGreaterThanOrEqual(1);
      expect(r.body.orderNumber).toBeLessThanOrEqual(20);
    });

    const orderNumbers = responses.map(r => r.body.orderNumber);
    const uniqueOrders = new Set(orderNumbers);
    expect(uniqueOrders.size).toBe(20); // Exactly 20 distinct sequential numbers
  });

  it('should handle duplicate email idempotently without sending duplicate email or leaking orderNumber', async () => {
    const email = 'duplicate.test@kindr.vn';

    // First submission
    const res1 = await request(app)
      .post('/api/waitlist')
      .send({ email, userRole: 'genz', consent: true });
    expect(res1.status).toBe(201);
    expect(res1.body.alreadyRegistered).toBe(false);

    // Second submission with same email
    const res2 = await request(app)
      .post('/api/waitlist')
      .send({ email, userRole: 'genz', consent: true });
    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.alreadyRegistered).toBe(true);
    expect(res2.body.orderNumber).toBeUndefined(); // Does not leak orderNumber
  });

  it('should grant 5 Xu Founding Member reward to user registering with waitlist email and prevent double claim', async () => {
    const founderEmail = 'claim5xu@kindr.vn';

    // 1. Join waitlist
    const wlRes = await request(app)
      .post('/api/waitlist')
      .send({ email: founderEmail, consent: true, userRole: 'mom' });
    expect(wlRes.status).toBe(201);

    // 2. Register account with same email in auth/register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Mẹ Bỉm Tiên Phong',
        phone: '0905999888',
        email: founderEmail,
        password: 'Password123!'
      });
    expect(regRes.status).toBe(201);
    expect(regRes.body.foundingMemberClaimed).toBe(true);

    const user = await User.findOne({ phone: '0905999888' });
    expect(user).not.toBeNull();
    // Default 10 welcome credit + 5 Xu founding bonus = 15 Xu
    expect(user?.xuBalance).toBe(15);
    expect(user?.welcomeCreditRemaining).toBe(15);

    // Verify Waitlist document is marked as claimed
    const wlDoc = await Waitlist.findOne({ email: founderEmail });
    expect(wlDoc?.xuClaimed).toBe(true);

    // 3. Subsequent activation or login cannot re-claim the 5 Xu
    const { claimWaitlistReward } = await import('../src/routes/auth');
    const secondClaim = await claimWaitlistReward(user!._id, founderEmail);
    expect(secondClaim).toBe(false);

    const userAfter = await User.findById(user!._id);
    expect(userAfter?.xuBalance).toBe(15); // Still 15, never double-credited
  });

  it('should return accurate waitlist stats from /api/waitlist/stats', async () => {
    const res = await request(app).get('/api/waitlist/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.target).toBe(200);
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.remaining).toBe('number');
    expect(typeof res.body.percentage).toBe('number');
    expect(res.body.remaining + res.body.total).toBe(200);
  });
});
