// server/tests/survey.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { PopupSurvey } from '../src/models/PopupSurvey';

const app = createApp();

const validBody = (phone: string) => ({
  phone,
  hasItemsToDeclutter: true,
  motivation: 'declutter',
  fearsFacebookScams: true,
  findsAppUseful: true,
  referralIntent: 'willing',
  consent: true,
});

describe('Pop-up FPT Plaza Survey API', () => {
  it('rejects missing answers, bad phone and missing consent (400)', async () => {
    const r1 = await request(app).post('/api/survey').send({ ...validBody('0905123456'), motivation: undefined });
    expect(r1.status).toBe(400);

    const r2 = await request(app).post('/api/survey').send(validBody('12345'));
    expect(r2.status).toBe(400);

    const r3 = await request(app).post('/api/survey').send({ ...validBody('0905123456'), consent: false });
    expect(r3.status).toBe(400);
  });

  it('creates response with 5 Xu reward code and Safe Fee waiver for early respondents', async () => {
    const res = await request(app).post('/api/survey').send(validBody('0905 111 222'));
    expect(res.status).toBe(201);
    expect(res.body.data.starterXu).toBe(5);
    expect(res.body.data.safeFeeWaiver).toBe(true);
    expect(res.body.data.rewardCode).toMatch(/^POP-[A-Z2-9]{6}$/);
    expect(res.body.data.waiverRemaining).toBe(49);

    const doc = await PopupSurvey.findOne({ phone: '0905111222' });
    expect(doc?.motivation).toBe('declutter');
  });

  it('is idempotent per phone and returns the same reward code', async () => {
    const first = await request(app).post('/api/survey').send(validBody('0912345678'));
    const second = await request(app).post('/api/survey').send(validBody('0912345678'));
    expect(second.status).toBe(200);
    expect(second.body.alreadySubmitted).toBe(true);
    expect(second.body.data.rewardCode).toBe(first.body.data.rewardCode);
    expect(await PopupSurvey.countDocuments({ phone: '0912345678' })).toBe(1);
  });

  it('returns public stats', async () => {
    const res = await request(app).get('/api/survey/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.waiverSlots).toBe(50);
    expect(res.body.data.total + res.body.data.waiverRemaining).toBe(50);
  });

  it('supports two-phase flow: fast claim phone first, then answers unlock safe fee waiver', async () => {
    // 1. Fast Claim phone only
    const claimRes = await request(app)
      .post('/api/survey/claim')
      .send({ phone: '0905 999 888', consent: true });
    expect(claimRes.status).toBe(201);
    expect(claimRes.body.data.starterXu).toBe(5);
    expect(claimRes.body.data.safeFeeWaiver).toBe(false);
    expect(claimRes.body.data.rewardCode).toMatch(/^POP-[A-Z2-9]{6}$/);

    // 2. Submit answers to unlock Safe Fee waiver
    const answersRes = await request(app)
      .post('/api/survey/answers')
      .send({
        phone: '0905 999 888',
        hasItemsToDeclutter: true,
        motivation: 'save_money',
        fearsFacebookScams: true,
      });
    expect(answersRes.status).toBe(200);
    expect(answersRes.body.data.safeFeeWaiver).toBe(true);

    const doc = await PopupSurvey.findOne({ phone: '0905999888' });
    expect(doc?.safeFeeWaiver).toBe(true);
    expect(doc?.motivation).toBe('save_money');
  });
});
