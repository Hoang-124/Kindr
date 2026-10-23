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
import { sendNotification, notifyAdmins } from '../services/notificationHelper';

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

    // Exclude own products only if explicitly requested by query
    if (req.userId && req.query.excludeOwn === 'true') {
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

    // Contact masking: Do NOT select phone for public feed listings
    if (maxRadius && userLat && userLng) {
      // Distance-filtered: fetch candidate set to calculate distance, filter, sort, and slice
      const rawProducts = await Product.find(filter)
        .populate('sellerId', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(300)
        .lean();

      let matched = rawProducts.map((p: any) => {
        const seller = p.sellerId && typeof p.sellerId === 'object' ? p.sellerId : null;
        const formatted = {
          ...p,
          id: p._id?.toString() || p.id,
          sellerId: seller?._id?.toString() || p.sellerId?.toString() || p.sellerId,
          sellerName: seller?.name || p.sellerName || 'Thành viên Kindr',
          sellerAvatar: seller?.avatar || p.sellerAvatar || '',
        };
        // Never leak raw phone on feed
        delete formatted.sellerPhone;

        const pLat = p.coordinates?.latitude || 16.0748;
        const pLng = p.coordinates?.longitude || 108.2240;
        const d = calculateHaversineKm(userLat, userLng, pLat, pLng);
        return { ...formatted, distance: `${d} km`, distanceKm: d };
      }).filter((p: any) => p.distanceKm <= maxRadius);

      matched.sort((a: any, b: any) => (a.distanceKm || 0) - (b.distanceKm || 0));

      const totalMatched = matched.length;
      const paginatedProducts = matched.slice(skip, skip + limitNum);

      res.json({
        products: paginatedProducts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalMatched,
          totalPages: Math.ceil(totalMatched / limitNum),
        },
      });
      return;
    }

    const [rawProducts, total] = await Promise.all([
      Product.find(filter)
        .populate('sellerId', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    let products = rawProducts.map((p: any) => {
      const seller = p.sellerId && typeof p.sellerId === 'object' ? p.sellerId : null;
      const formatted = {
        ...p,
        id: p._id?.toString() || p.id,
        sellerId: seller?._id?.toString() || p.sellerId?.toString() || p.sellerId,
        sellerName: seller?.name || p.sellerName || 'Thành viên Kindr',
        sellerAvatar: seller?.avatar || p.sellerAvatar || '',
      };
      // Contact masking: Remove sellerPhone from public listing
      delete formatted.sellerPhone;

      if (userLat && userLng) {
        const pLat = p.coordinates?.latitude || 16.0748;
        const pLng = p.coordinates?.longitude || 108.2240;
        const d = calculateHaversineKm(userLat, userLng, pLat, pLng);
        return { ...formatted, distance: `${d} km`, distanceKm: d };
      }
      return formatted;
    });

    if (userLat && userLng) {
      products.sort((a: any, b: any) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
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
    const rawProduct: any = await Product.findById(req.params.id)
      .populate('sellerId', 'name avatar phone')
      .lean();
    if (!rawProduct) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
      return;
    }

    const seller = rawProduct.sellerId && typeof rawProduct.sellerId === 'object' ? rawProduct.sellerId : null;
    const product = {
      ...rawProduct,
      sellerId: seller?._id?.toString() || rawProduct.sellerId?.toString() || rawProduct.sellerId,
      sellerName: seller?.name || rawProduct.sellerName || 'Thành viên Kindr',
      sellerAvatar: seller?.avatar || rawProduct.sellerAvatar || '',
      sellerPhone: rawProduct.sellerPhone || seller?.phone || '',
    };

    // Mask seller phone if viewer is not matched and not admin
    if (req.userId !== product.sellerId && req.userRole !== 'admin') {
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

    // Price Matrix & Price Anchoring System
    const PRICING_MATRIX: Record<string, Record<'70' | '80' | '90', number>> = {
      book: { '90': 2, '80': 1, '70': 1 },
      sach_truyen: { '90': 2, '80': 1, '70': 1 },
      toy_small: { '90': 2, '80': 2, '70': 2 },
      do_choi: { '90': 2, '80': 2, '70': 2 },
      toy_large: { '90': 10, '80': 8, '70': 5 },
      xe_noi: { '90': 30, '80': 20, '70': 15 },
      quan_ao: { '90': 5, '80': 3, '70': 2 },
      do_hoc_tap: { '90': 4, '80': 3, '70': 2 },
      charity: { '90': 0, '80': 0, '70': 0 },
      tu_thien: { '90': 0, '80': 0, '70': 0 },
    };

    const MAX_PRICE_BY_CATEGORY: Record<string, number> = {
      charity: 0,
      tu_thien: 0,
      book: 5,
      sach_truyen: 5,
      toy_small: 10,
      do_choi: 10,
      quan_ao: 10,
      do_hoc_tap: 10,
      toy_large: 20,
      xe_noi: 50,
    };

    const isCharity = data.category === 'charity' || data.category === 'tu_thien';
    if (isCharity && data.price !== 0) {
      res.status(400).json({ error: 'Món đồ thuộc danh mục từ thiện bắt buộc phải có giá là 0 Xu.' });
      return;
    }

    const cond = data.condition as '70' | '80' | '90';
    const matrixLimit = PRICING_MATRIX[data.category]?.[cond];
    const maxAllowedPrice = matrixLimit !== undefined ? matrixLimit : (MAX_PRICE_BY_CATEGORY[data.category] ?? 30);

    if (data.price > maxAllowedPrice) {
      res.status(400).json({
        error: `Mức giá ${data.price} Xu vượt quá khung định giá cho phép của danh mục này (tối đa ${maxAllowedPrice} Xu cho độ mới ${data.condition}%). Kindr áp dụng khung định giá chuẩn để chống ngáo giá.`,
      });
      return;
    }

    // Calculate SafeFee 10% (minimum 1 Xu, charity = 0)
    const safeFee = (isCharity || data.price === 0) ? 0 : Math.max(1, Math.ceil(data.price * 0.1));

    // Check balance for SafeFee
    if (safeFee > 0 && seller.xuBalance < safeFee) {
      res.status(400).json({
        error: `Số dư ví không đủ để ký quỹ ${safeFee} Xu Safe Fee (10%). Số dư hiện tại: ${seller.xuBalance} Xu. Hãy nạp thêm Xu để đăng đồ nhé!`,
      });
      return;
    }

    // Deduct SafeFee from balance with Welcome Credit tracking
    let safeFeePromoUsed = 0;
    if (safeFee > 0) {
      const initialPromo = seller.welcomeCreditRemaining || 0;
      const updatedSeller = await User.findOneAndUpdate(
        { _id: seller._id, xuBalance: { $gte: safeFee }, isLocked: { $ne: true } },
        [
          {
            $set: {
              _promoUsed: {
                $min: [
                  { $ifNull: ['$welcomeCreditRemaining', 0] },
                  safeFee,
                ],
              },
            },
          },
          {
            $set: {
              xuBalance: { $subtract: ['$xuBalance', safeFee] },
              xuFrozen: { $add: ['$xuFrozen', safeFee] },
              welcomeCreditRemaining: {
                $subtract: [
                  { $ifNull: ['$welcomeCreditRemaining', 0] },
                  '$_promoUsed',
                ],
              },
            },
          },
          {
            $unset: '_promoUsed',
          },
        ],
        { new: true }
      );

      if (!updatedSeller) {
        res.status(400).json({
          error: `Số dư ví không đủ để ký quỹ ${safeFee} Xu Safe Fee (10%).`,
        });
        return;
      }
      safeFeePromoUsed = Math.max(0, initialPromo - (updatedSeller.welcomeCreditRemaining ?? 0));
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
      safeFeePromoXu: safeFeePromoUsed,
      status: 'available',
    });

    // Trigger real-time notifications
    try {
      sendNotification({
        userId: seller._id,
        type: 'post_approved',
        title: 'Đăng tin thành công! 🎉',
        body: `Món đồ "${data.name}" đã được hiển thị trực tiếp trên sàn Kindr.`,
        relatedProductId: product._id,
        data: { productId: product._id.toString() },
      });
    } catch (notifErr) {
      console.warn('Create product notification warning:', notifErr);
    }

    res.status(201).json({
      message: `Đăng đồ thành công! Món đồ "${data.name}" đã được hiển thị trên sàn Kindr.`,
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
    const allowedFields = ['name', 'description', 'category', 'conditionLabel', 'image', 'additionalImages', 'ageRange', 'locationName', 'wardId', 'districtId'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (product as any)[field] = req.body[field];
      }
    }
    if (req.body.condition !== undefined && ['70', '80', '90'].includes(req.body.condition)) {
      product.condition = req.body.condition;
      if (!req.body.conditionLabel) {
        product.conditionLabel = `Mới ${req.body.condition}%`;
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
    // Atomic CAS transition: only available products can be removed by their seller
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.userId, status: 'available' },
      { $set: { status: 'removed' } },
      { new: true }
    );

    if (!product) {
      res.status(400).json({ error: 'Không tìm thấy sản phẩm, bạn không có quyền xóa hoặc sản phẩm đang trong giao dịch.' });
      return;
    }

    // Refund SafeFee back to seller ONLY after atomic status transition
    if (product.safeFeeLocked > 0) {
      await User.findByIdAndUpdate(req.userId, {
        $inc: {
          xuBalance: product.safeFeeLocked,
          xuFrozen: -product.safeFeeLocked,
          welcomeCreditRemaining: product.safeFeePromoXu || 0,
        },
      });
    }

    res.json({
      message: `Đã xóa sản phẩm. Hoàn trả ${product.safeFeeLocked} Xu Safe Fee vào ví.`,
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * POST /api/products/ai-suggest
 * Intelligent AI Assistant for listing baby items on Kindr.
 * Evaluates fair market Xu price, category, age range, and generates mom-friendly descriptions.
 */
router.post('/ai-suggest', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { itemName, selectedCategory, selectedCondition } = req.body || {};
    const name = (itemName || '').toString().trim().toLowerCase();

    // Heuristic category detection
    let detectedCategory = 'toy_small';
    let detectedAge = '1-3y';
    let suggestedXu = 2;

    if (name.includes('xe') || name.includes('nôi') || name.includes('cũi') || name.includes('stroller')) {
      detectedCategory = 'xe_noi';
      detectedAge = '0-6m';
      suggestedXu = 15;
    } else if (name.includes('sách') || name.includes('truyện') || name.includes('ehon') || name.includes('flashcard')) {
      detectedCategory = 'book';
      detectedAge = '1-3y';
      suggestedXu = 2;
    } else if (name.includes('áo') || name.includes('quần') || name.includes('váy') || name.includes('body') || name.includes('yếm')) {
      detectedCategory = 'quan_ao';
      detectedAge = '6-12m';
      suggestedXu = 3;
    } else if (name.includes('học') || name.includes('bút') || name.includes('bảng') || name.includes('vở')) {
      detectedCategory = 'do_hoc_tap';
      detectedAge = '3+';
      suggestedXu = 3;
    } else if (name.includes('lớn') || name.includes('cầu trượt') || name.includes('nhà bóng') || name.includes('lego')) {
      detectedCategory = 'toy_large';
      detectedAge = '1-3y';
      suggestedXu = 8;
    }

    const category = selectedCategory || detectedCategory;
    const condition = selectedCondition || '90';

    const descriptions: Record<string, string> = {
      xe_noi: `Xe / nôi cho bé giữ gìn rất cẩn thận, khung kim loại chắc chắn, đệm lót sạch sẽ đã tiệt trùng bằng nước giặt hữu cơ. Khung gấp gọn tiện lợi khi cho bé đi dạo hoặc đi du lịch. Bé nhà mình đã lớn nên nhượng lại cho mẹ nào cần nhé.`,
      book: `Bộ sách truyện tranh hình ảnh sinh động, màu sắc tươi sáng giúp bé phát triển ngôn ngữ và trí tưởng tượng. Giấy dày dặn, không quăn mép, bé xem rất thích. Mẹ pass lại cho bé khác cùng đọc nha.`,
      quan_ao: `Chất liệu cotton 100% mềm mịn, thấm hút mồ hôi tốt, an toàn cho làn da nhạy cảm của bé. Form dáng xinh xắn, đường may tỉ mỉ, bé mặc chỉ vài lần dịp đi chơi nên còn rất mới.`,
      do_hoc_tap: `Đồ dùng học tập và phát triển tư duy cho bé, các chi tiết bo tròn an toàn không góc nhọn. Giúp bé rèn luyện tính kiên nhẫn và khả năng sáng tạo.`,
      toy_large: `Đồ chơi phát triển vận động cho bé, chất liệu nhựa nguyên sinh ABS an toàn không mùi. Kết cấu vững chãi, các khớp nối chắc chắn giúp bé chơi vui và an toàn tại nhà.`,
      toy_small: `Món đồ chơi nhỏ xinh cho bé luyện cầm nắm và phản xạ linh hoạt. Âm thanh vui nhộn, màu sắc bắt mắt, các góc cạnh đều được bo tròn an toàn tuyệt đối.`,
    };

    res.json({
      category,
      condition,
      ageRange: detectedAge,
      suggestedXu,
      description: descriptions[category] || descriptions.toy_small,
    });
  } catch (error) {
    console.error('AI suggest error:', error);
    res.status(500).json({ error: 'Không thể tạo gợi ý AI.' });
  }
});

export default router;
