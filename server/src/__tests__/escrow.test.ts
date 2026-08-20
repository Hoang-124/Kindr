// server/src/__tests__/escrow.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../createApp';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { ENV } from '../config/env';

const app = createApp();
let seller: any;
let buyer: any;
let sellerToken = '';
let buyerToken = '';
let product: any;
let transactionId = '';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(ENV.MONGO_URI);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  seller = await User.create({
    name: 'Mẹ Seller Escrow',
    phone: '0999777888',
    passwordHash,
    xuBalance: 20,
    welcomeCreditRemaining: 0,
    civilizationPoints: 95,
  });

  buyer = await User.create({
    name: 'Mẹ Buyer Escrow',
    phone: '0999888999',
    passwordHash,
    xuBalance: 30,
    welcomeCreditRemaining: 0,
    civilizationPoints: 95,
  });

  sellerToken = jwt.sign({ userId: seller._id.toString(), role: 'user' }, ENV.JWT_SECRET);
  buyerToken = jwt.sign({ userId: buyer._id.toString(), role: 'user' }, ENV.JWT_SECRET);

  // Seller creates a product (10 Xu, 1 Xu safe fee)
  product = await Product.create({
    name: 'Địu em bé Ergobaby Omni 360',
    price: 10,
    condition: '90',
    conditionLabel: 'Mới 90%',
    category: 'diu_be',
    locationName: 'Quận Sơn Trà, Đà Nẵng',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=500',
    description: 'Địu trợ lực cao cấp chính hãng.',
    sellerId: seller._id,
    sellerName: seller.name,
    safeFeeLocked: 1,
    status: 'available',
  });
  seller.xuBalance -= 1;
  seller.xuFrozen += 1;
  await seller.save();
});

afterAll(async () => {
  await Transaction.deleteMany({ $or: [{ buyerId: buyer._id }, { sellerId: seller._id }] });
  await Product.deleteMany({ sellerId: seller._id });
  await User.deleteMany({ phone: { $in: ['0999777888', '0999888999'] } });
  await mongoose.connection.close();
});

describe('⚖️ Double Escrow Lifecycle Integration Tests', () => {
  it('POST /api/transactions → should create escrow and freeze buyer Xu (100%)', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.transaction).toBeDefined();
    expect(res.body.transaction.status).toBe('awaiting_handover');
    expect(res.body.transaction.buyerEscrowFrozen).toBe(10);
    expect(res.body.transaction.sellerEscrowFrozen).toBe(1);
    transactionId = res.body.transaction._id;

    // Check buyer balance was frozen
    const updatedBuyer = await User.findById(buyer._id);
    expect(updatedBuyer?.xuBalance).toBe(20); // 30 - 10
    expect(updatedBuyer?.xuFrozen).toBe(10);
  });

  it('POST /api/transactions/:id/handover → should confirm handover and start 6-Hour Safeful Time', async () => {
    const res = await request(app)
      .post(`/api/transactions/${transactionId}/handover`)
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('6 Giờ Kiểm Định');

    const tx = await Transaction.findById(transactionId);
    expect(tx?.status).toBe('in_safeful_time');
    expect(tx?.safefulTimeExpiresAt).toBeDefined();
  });

  it('POST /api/transactions/:id/complete → should finalize transaction and release Xu (10 + 1) to seller', async () => {
    const res = await request(app)
      .post(`/api/transactions/${transactionId}/complete`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('hoàn tất thành công');

    const tx = await Transaction.findById(transactionId);
    expect(tx?.status).toBe('completed');

    // Check seller received buyer's 10 Xu + refunded 1 Xu SafeFee = 11 Xu total
    const updatedSeller = await User.findById(seller._id);
    expect(updatedSeller?.xuBalance).toBe(30); // 19 + 11 = 30
    expect(updatedSeller?.xuFrozen).toBe(0);

    // Check buyer's frozen Xu released
    const updatedBuyer = await User.findById(buyer._id);
    expect(updatedBuyer?.xuFrozen).toBe(0);
  });
});
