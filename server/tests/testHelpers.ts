// server/tests/testHelpers.ts
import jwt from 'jsonwebtoken';
import { User, IUser } from '../src/models/User';
import { Product, IProduct } from '../src/models/Product';
import { ENV } from '../src/config/env';

export async function createTestUser(overrides: Partial<IUser> = {}) {
  const phone = overrides.phone || `090${Math.floor(1000000 + Math.random() * 9000000)}`;
  const user = await User.create({
    name: 'Mẹ Bỉm Test',
    phone,
    passwordHash: 'hashed_password_for_test',
    xuBalance: 50,
    xuFrozen: 0,
    welcomeCreditRemaining: 10,
    welcomeCreditExpiresAt: new Date(Date.now() + 30 * 86400 * 1000),
    civilizationPoints: 100,
    role: 'user',
    ...overrides,
  });

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    ENV.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token };
}

export async function createTestProduct(sellerId: any, overrides: Partial<IProduct> = {}) {
  const safeFee = overrides.safeFeeLocked !== undefined ? overrides.safeFeeLocked : 1;
  if (safeFee > 0) {
    await User.findByIdAndUpdate(sellerId, { $inc: { xuFrozen: safeFee } });
  }
  return await Product.create({
    name: 'Đồ chơi xếp hình gỗ an toàn cho bé',
    description: 'Bộ đồ chơi gỗ an toàn còn mới 90% không xước',
    price: 10,
    category: 'toys',
    condition: '90',
    conditionLabel: 'Như mới 90%',
    image: 'https://example.com/toy.jpg',
    additionalImages: [],
    sellerId,
    sellerName: 'Mẹ Bỉm Bán Hàng',
    sellerPhone: '0901234567',
    locationName: 'Quận Hải Châu, Đà Nẵng',
    safeFeeLocked: 1,
    safeFeePromoXu: 0,
    status: 'available',
    ...overrides,
  });
}
