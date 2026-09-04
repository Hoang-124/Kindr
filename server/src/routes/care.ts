// server/src/routes/care.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { CareRecord } from '../models/CareRecord';
import { User } from '../models/User';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ---- Validation Schemas ----

const ToggleVaccineSchema = z.object({
  vaccineId: z.string().min(1, 'Mã vắc xin không hợp lệ'),
  vaccineName: z.string().min(1, 'Tên vắc xin không hợp lệ'),
  isCompleted: z.boolean(),
  completedDate: z.string().optional(),
  facilityName: z.string().optional(),
  notes: z.string().optional(),
});

const AddGrowthSchema = z.object({
  childName: z.string().min(1, 'Tên bé không được để trống'),
  date: z.string().min(1, 'Ngày ghi nhận không được để trống'),
  ageMonths: z.number().min(0).max(120),
  weightKg: z.number().min(1).max(100),
  heightCm: z.number().min(30).max(200),
});

const AddReviewSchema = z.object({
  title: z.string().min(3, 'Tên trường/phòng khám phải từ 3 ký tự'),
  category: z.string().min(2),
  rating: z.number().min(1).max(5),
  address: z.string().min(5, 'Địa chỉ phải từ 5 ký tự'),
  comment: z.string().min(10, 'Nội dung nhận xét ít nhất 10 ký tự'),
});

// ---- Routes ----

/**
 * GET /api/care/vaccines
 * Get all vaccine records for current user.
 */
router.get('/vaccines', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const records = await CareRecord.find({
      userId: req.userId,
      type: 'vaccine',
    }).lean();

    res.json({ vaccines: records });
  } catch (error) {
    console.error('Get vaccines error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy sổ tiêm chủng.' });
  }
});

/**
 * POST /api/care/vaccines/toggle
 * Toggle or update vaccine completion status in Cloud DB.
 */
router.post('/vaccines/toggle', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = ToggleVaccineSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { vaccineId, vaccineName, isCompleted, completedDate, facilityName, notes } = parsed.data;
    const user = await User.findById(req.userId);

    const record = await CareRecord.findOneAndUpdate(
      { userId: req.userId, type: 'vaccine', vaccineId },
      {
        $set: {
          userName: user?.name || 'Mẹ Kindr',
          vaccineName,
          isCompleted,
          completedDate: completedDate || new Date().toLocaleDateString('vi-VN'),
          facilityName: facilityName || 'Trạm Y tế Phường',
          notes: notes || '',
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      message: isCompleted ? 'Đã ghi nhận tiêm chủng thành công! 💉' : 'Đã cập nhật trạng thái mũi tiêm.',
      record,
    });
  } catch (error) {
    console.error('Toggle vaccine error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật sổ tiêm chủng.' });
  }
});

/**
 * GET /api/care/growth
 * Get growth records for current user's child.
 */
router.get('/growth', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const records = await CareRecord.find({
      userId: req.userId,
      type: 'growth',
    }).sort({ ageMonths: 1 }).lean();

    res.json({ growthRecords: records });
  } catch (error) {
    console.error('Get growth records error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy dữ liệu tăng trưởng.' });
  }
});

/**
 * POST /api/care/growth
 * Add a new growth record (WHO standard evaluation) to Cloud DB.
 */
router.post('/growth', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = AddGrowthSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { childName, date, ageMonths, weightKg, heightCm } = parsed.data;
    const user = await User.findById(req.userId);

    // Basic WHO status estimation
    let whoWeightStatus: 'underweight' | 'normal' | 'overweight' = 'normal';
    if (ageMonths <= 12 && weightKg < 7) whoWeightStatus = 'underweight';
    if (ageMonths > 12 && weightKg > 15) whoWeightStatus = 'overweight';

    const record = await CareRecord.create({
      userId: req.userId,
      userName: user?.name || 'Mẹ Kindr',
      childName,
      type: 'growth',
      date,
      ageMonths,
      weightKg,
      heightCm,
      whoWeightStatus,
      whoHeightStatus: 'normal',
    });

    res.status(201).json({
      message: 'Đã lưu chỉ số phát triển của bé lên đám mây thành công! 📈',
      record,
    });
  } catch (error) {
    console.error('Add growth error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lưu chỉ số phát triển.' });
  }
});

/**
 * GET /api/care/reviews
 * Get community reviews (kindergartens, clinics).
 */
router.get('/reviews', optionalAuth, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviews = await CareRecord.find({ type: 'community_review' })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy đánh giá cộng đồng.' });
  }
});

/**
 * POST /api/care/reviews
 * Submit community review for daycare/clinic.
 */
router.post('/reviews', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = AddReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { title, category, rating, address, comment } = parsed.data;
    const user = await User.findById(req.userId);

    const review = await CareRecord.create({
      userId: req.userId,
      userName: user?.name || 'Mẹ Kindr',
      userAvatar: user?.avatar || '',
      type: 'community_review',
      reviewTitle: title,
      reviewCategory: category,
      reviewRating: rating,
      reviewAddress: address,
      reviewComment: comment,
      reviewLikesCount: 0,
    });

    res.status(201).json({
      message: 'Đã đăng bài chia sẻ kinh nghiệm chọn trường/phòng khám! ❤️',
      review,
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi gửi nhận xét.' });
  }
});

export default router;
