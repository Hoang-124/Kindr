// server/tests/products.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/createApp';
import { createTestUser, createTestProduct } from './testHelpers';
import { User } from '../src/models/User';
import { Product } from '../src/models/Product';

const app = createApp();

describe('Product Pricing Limits & SafeFee Locking Tests', () => {
  it('should reject product price exceeding category ceiling', async () => {
    const { token } = await createTestUser({ xuBalance: 100 });

    // Category 'clothes' ceiling is 30 Xu
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Áo khoác len cho bé',
        description: 'Áo len ấm áp mùa đông',
        price: 50, // exceeds 30
        category: 'clothes',
        condition: '90',
        conditionLabel: 'Như mới 90%',
        image: 'https://example.com/coat.jpg',
        locationName: 'Quận Hải Châu, Đà Nẵng',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/vượt quá khung định giá/i);
  });

  it('should lock SafeFee on creation and refund SafeFee on deletion', async () => {
    const { user, token } = await createTestUser({ xuBalance: 20 });

    // 1. Create product: price = 10 -> SafeFee 10% = 1 Xu
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Xe chòi chân cho bé',
        description: 'Xe chòi chân 4 bánh cho bé tập đi',
        price: 10,
        category: 'strollers',
        condition: '80',
        conditionLabel: 'Tốt 80%',
        image: 'https://example.com/bike.jpg',
        locationName: 'Quận Hải Châu, Đà Nẵng',
      });

    expect(createRes.status).toBe(201);
    const prodId = createRes.body.product._id;

    // Check user balance: 20 - 1 = 19
    const userAfterCreate = await User.findById(user._id);
    expect(userAfterCreate?.xuBalance).toBe(19);

    // 2. Delete product
    const deleteRes = await request(app)
      .delete(`/api/products/${prodId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    // Check user balance refunded: 19 + 1 = 20
    const userAfterDelete = await User.findById(user._id);
    expect(userAfterDelete?.xuBalance).toBe(20);

    // Verify product status is removed
    const prodAfterDelete = await Product.findById(prodId);
    expect(prodAfterDelete?.status).toBe('removed');
  });

  it('should block deletion of a product currently locked in escrow (400)', async () => {
    const { user: seller, token: sellerToken } = await createTestUser({ xuBalance: 20 });
    const product = await createTestProduct(seller._id, { price: 10, safeFeeLocked: 1 });
    const { token: buyerToken } = await createTestUser({ xuBalance: 20 });

    // Buyer puts product in escrow
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId: product._id.toString() });

    // Seller tries to delete product while it's in escrow
    const deleteRes = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(deleteRes.status).toBe(400);
    expect(deleteRes.body.error).toMatch(/không có quyền xóa hoặc sản phẩm đang trong giao dịch/i);

    // Product remains in escrow status
    const checkProd = await Product.findById(product._id);
    expect(checkProd?.status).toBe('escrow');
  });
});
