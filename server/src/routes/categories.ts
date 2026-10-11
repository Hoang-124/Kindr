// server/src/routes/categories.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

const DEFAULT_CATEGORIES = [
  { name: 'Đồ chơi cho bé', code: 'do_choi', icon: 'toy-brick', order: 1 },
  { name: 'Quần áo sơ sinh Nous nous', code: 'quan_ao', icon: 'shirt', order: 2 },
  { name: 'Sách truyện Ehon', code: 'sach_truyen', icon: 'book-open', order: 3 },
  { name: 'Đồ học tập phát triển trí não', code: 'do_hoc_tap', icon: 'graduation-cap', order: 4 },
  { name: 'Xe nôi cũi võng xếp', code: 'xe_noi', icon: 'baby', order: 5 },
  { name: 'Trạm Tặng Đồ 0 Xu', code: 'tu_thien', icon: 'gift', order: 6 },
];

/**
 * GET /api/categories
 * Returns active categories with current product counts.
 * Seeds defaults if collection is empty.
 */
router.get('/', async (_req, res: Response) => {
  try {
    let categories = await Category.find({ isActive: true }).sort({ order: 1, createdAt: 1 });

    if (categories.length === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
      categories = await Category.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    }

    // Calculate live itemsCount from products collection
    const counts = await Product.aggregate([
      { $match: { status: { $ne: 'removed' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const item of counts) {
      if (item._id) {
        countMap.set(item._id.toLowerCase(), item.count);
      }
    }

    const result = categories.map((cat) => ({
      id: cat._id.toString(),
      _id: cat._id.toString(),
      name: cat.name,
      code: cat.code,
      icon: cat.icon || 'package',
      order: cat.order,
      itemsCount: countMap.get(cat.code.toLowerCase()) || 0,
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Không thể tải danh sách danh mục.' });
  }
});

const CategoryCreateSchema = z.object({
  name: z.string().min(2, 'Tên danh mục ít nhất 2 ký tự').trim(),
  code: z.string().min(2, 'Mã danh mục ít nhất 2 ký tự').trim().toLowerCase(),
  icon: z.string().optional(),
  order: z.number().optional(),
});

/**
 * POST /api/categories
 * Admin only: Create a new category
 */
router.post('/', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const validated = CategoryCreateSchema.parse(req.body);

    const existing = await Category.findOne({ code: validated.code });
    if (existing) {
      res.status(400).json({ error: `Mã danh mục "${validated.code}" đã tồn tại.` });
      return;
    }

    const category = await Category.create({
      name: validated.name,
      code: validated.code,
      icon: validated.icon || 'package',
      order: validated.order ?? 0,
      isActive: true,
      itemsCount: 0,
    });

    res.status(201).json({
      id: category._id.toString(),
      _id: category._id.toString(),
      name: category.name,
      code: category.code,
      icon: category.icon,
      order: category.order,
      itemsCount: 0,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0]?.message || 'Dữ liệu không hợp lệ.' });
      return;
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Không thể tạo danh mục.' });
  }
});

/**
 * DELETE /api/categories/:id
 * Admin only: Delete category
 */
router.delete('/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({ error: 'Không tìm thấy danh mục.' });
      return;
    }

    // Check if products exist in category
    const productCount = await Product.countDocuments({
      category: category.code,
      status: { $ne: 'removed' },
    });

    if (productCount > 0) {
      res.status(400).json({
        error: `Không thể xóa vì còn ${productCount} sản phẩm thuộc danh mục này.`,
      });
      return;
    }

    await Category.findByIdAndDelete(id);

    res.json({ message: 'Đã xóa danh mục thành công.', id });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Không thể xóa danh mục.' });
  }
});

export default router;
