// server/src/routes/reports.ts
// ========================================
// TRUST & SAFETY USER REPORTS ROUTES
// ========================================
import { Router, Response } from 'express';
import { z } from 'zod';
import { Report } from '../models/Report';
import { User } from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ---- Validation Schemas ----

const CreateReportSchema = z.object({
  targetType: z.enum(['user', 'product', 'transaction']),
  targetId: z.string().min(1, 'Thiếu targetId'),
  reason: z.string().min(5, 'Lý do báo cáo phải từ 5 ký tự trở lên'),
});

// ---- Routes ----

/**
 * POST /api/reports
 * Submit a report against user, product or transaction
 */
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = CreateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const reporter = await User.findById(req.userId);
    if (!reporter) {
      res.status(404).json({ error: 'Tài khoản không tồn tại.' });
      return;
    }

    const { targetType, targetId, reason } = parsed.data;

    const report = await Report.create({
      targetType,
      targetId,
      reporterId: reporter._id,
      reporterName: reporter.name,
      reason,
      status: 'open',
    });

    res.status(201).json({
      message: 'Đã gửi báo cáo vi phạm. Đội ngũ kiểm duyệt Kindr sẽ xác minh trong 24h.',
      report,
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi gửi báo cáo.' });
  }
});

/**
 * GET /api/reports/my
 * Get list of reports filed by current user
 */
router.get('/my', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reports = await Report.find({ reporterId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reports });
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy báo cáo.' });
  }
});

export default router;
