// server/src/routes/products.ts
// ========================================
// COMPLETE PRODUCTS CRUD — Pattern for remaining routes
// ========================================
import { Router, Response } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { validateObjectId } from '../middleware/validateObjectId';

const router = Router();

// ---- Validation ----

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const CreateProductSchema = z.object({
  name: z.string().min(5, 'Tên sản phẩm phải ít nhất 5 ký tự'),
  price: z.number().min(0),
  condition: z.enum(['70', '80', '90']),
  conditionLabel: z.string(),
  category: z.string(),
  ageRange: z.string().optional(),
  locationName: z.string(),
  wardId: z.string().optional(),
  districtId: z.string().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  image: z.string().min(1, 'Ảnh sản phẩm không được để trống'),
  additionalImages: z.array(z.string()).optional(),
  description: z.string().min(10, 'Mô tả phải ít nhất 10 ký tự'),
});

// ---- Routes ----

/**
 * GET /api/products
 * List products with filters. Public (optionalAuth for excluding own items).
 */
router.get('/', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      category,
      districtId,
      condition,
      search,
      minPrice,
      maxPrice,
      page = '1',
      limit = '20',
    } = req.query;

    // Build filter query
    const filter: Record<string, any> = { status: 'available' };

    // Exclude own products if logged in
    if (req.userId) {
      filter.sellerId = { $ne: req.userId };
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (districtId && districtId !== 'all') {
      filter.districtId = districtId;
    }

    if (condition && condition !== 'all') {
      filter.condition = condition;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search && typeof search === 'string' && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const userLat = req.query.lat ? parseFloat(req.query.lat as string) : null;
    const userLng = req.query.lng ? parseFloat(req.query.lng as string) : null;
    const maxRadius = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : null;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [rawProducts, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    let products = rawProducts.map((p: any) => {
      if (userLat && userLng) {
        const pLat = p.coordinates?.latitude || 16.0748;
        const pLng = p.coordinates?.longitude || 108.2240;
        const d = calculateHaversineKm(userLat, userLng, pLat, pLng);
        return { ...p, distance: `${d} km`, distanceKm: d };
      }
      return p;
    });

    if (maxRadius && userLat && userLng) {
      products = products.filter((p: any) => p.distanceKm <= maxRadius);
    }

    if (userLat && userLng) {
      products.sort((a: any, b: any) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: maxRadius ? products.length : total,
        totalPages: Math.ceil((maxRadius ? products.length : total) / limitNum),
      },
    });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * GET /api/products/my
 * Get current user's products.
 */
router.get('/my', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ sellerId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ products });
  } catch (error) {
    console.error('My products error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * GET /api/products/:id
 * Get single product detail.
 */
router.get('/:id', validateObjectId('id'), optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
      return;
    }

    // Mask seller phone if viewer is not matched
    if (req.userId !== product.sellerId.toString()) {
      if (product.sellerPhone) {
        product.sellerPhone = product.sellerPhone.replace(/(\d{4})\d{3}(\d{3})/, '$1***$2');
      }
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * POST /api/products
 * Create new product listing. Locks SafeFee 10% from seller balance.
 */
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = CreateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const seller = await User.findById(req.userId);
    if (!seller) {
      res.status(404).json({ error: 'Tài khoản không tồn tại.' });
      return;
    }

    if (seller.isLocked) {
      res.status(403).json({ error: 'Tài khoản đang bị khóa, không thể đăng đồ.' });
      return;
    }

    const data = parsed.data;

    // Calculate SafeFee 10% (minimum 1 Xu, charity = 0)
    const isCharity = data.category === 'charity' || data.category === 'tu_thien' || data.price === 0;
    const safeFee = isCharity ? 0 : Math.max(1, Math.ceil(data.price * 0.1));

    // Check balance for SafeFee
    if (safeFee > 0 && seller.xuBalance < safeFee) {
      res.status(400).json({
        error: `Số dư ví không đủ để ký quỹ ${safeFee} Xu Safe Fee (10%). Số dư hiện tại: ${seller.xuBalance} Xu.`,
      });
      return;
    }

    // Create product
    const product = await Product.create({
      ...data,
      coordinates: data.coordinates || { latitude: 16.0748, longitude: 108.2240 },
      sellerId: seller._id,
      sellerName: seller.name,
      sellerAvatar: seller.avatar,
      sellerPhone: seller.phone,
      sellerZalo: seller.phone,
      safeFeeLocked: safeFee,
      status: 'available',
    });

    // Deduct SafeFee from balance, add to frozen
    if (safeFee > 0) {
      seller.xuBalance -= safeFee;
      seller.xuFrozen += safeFee;
      await seller.save();
    }

    res.status(201).json({
      message: isCharity
        ? `Đã đăng lên Trạm Tặng Đồ (0 Xu) ❤️`
        : `Đăng đồ thành công! Đã tạm khóa ${safeFee} Xu Safe Fee.`,
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * PUT /api/products/:id
 * Update product (only owner, only while status=available).
 */
router.put('/:id', validateObjectId('id'), requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
      return;
    }

    if (product.sellerId.toString() !== req.userId) {
      res.status(403).json({ error: 'Bạn không có quyền sửa sản phẩm này.' });
      return;
    }

    if (product.status !== 'available') {
      res.status(400).json({ error: 'Không thể sửa sản phẩm đang trong giao dịch.' });
      return;
    }

    // Only allow updating specific fields
    const allowedFields = ['name', 'description', 'image', 'additionalImages', 'ageRange', 'locationName', 'wardId', 'districtId'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (product as any)[field] = req.body[field];
      }
    }

    await product.save();
    res.json({ message: 'Đã cập nhật sản phẩm.', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * DELETE /api/products/:id
 * Remove product (only owner, only while available). Refunds SafeFee.
 */
router.delete('/:id', validateObjectId('id'), requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
      return;
    }

    if (product.sellerId.toString() !== req.userId) {
      res.status(403).json({ error: 'Bạn không có quyền xóa sản phẩm này.' });
      return;
    }

    if (product.status !== 'available') {
      res.status(400).json({ error: 'Không thể xóa sản phẩm đang trong giao dịch.' });
      return;
    }

    // Refund SafeFee back to seller
    if (product.safeFeeLocked > 0) {
      await User.findByIdAndUpdate(req.userId, {
        $inc: {
          xuBalance: product.safeFeeLocked,
          xuFrozen: -product.safeFeeLocked,
        },
      });
    }

    product.status = 'removed';
    await product.save();

    res.json({
      message: `Đã xóa sản phẩm. Hoàn trả ${product.safeFeeLocked} Xu Safe Fee vào ví.`,
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

export default router;
