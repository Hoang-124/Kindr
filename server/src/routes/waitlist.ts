// server/src/routes/waitlist.ts
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { Waitlist } from '../models/Waitlist';
import { Counter } from '../models/Counter';
import { sendWaitlistWelcomeEmail, isEmailConfigured } from '../services/emailService';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { ENV } from '../config/env';

const router = Router();

// Rate limiter: max 10 submissions per 15 minutes per IP (skipped in test mode)
const waitlistSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => ENV.NODE_ENV === 'test',
  message: {
    success: false,
    error: 'Bạn đã đăng ký quá nhiều lần. Vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const WaitlistSchema = z.object({
  email: z
    .string({ required_error: 'Vui lòng nhập địa chỉ email nhận thông báo' })
    .trim()
    .toLowerCase()
    .email('Địa chỉ email không đúng định dạng (ví dụ: me@example.com)')
    .max(120, 'Email không được vượt quá 120 ký tự'),
  phone: z
    .string()
    .trim()
    .optional()
    .default('')
    .refine(
      (val) => !val || /^(0[35789])[0-9]{8}$/.test(val.replace(/[\s.-]/g, '')),
      'Số điện thoại liên hệ phải là 10 chữ số Việt Nam hợp lệ (ví dụ: 0905123456)'
    ),
  userRole: z.enum(['mom', 'genz']).default('mom'),
  interest: z
    .enum(['Đồ chơi vận động', 'Xe đẩy, nôi cũi', 'Quần áo Nous/cotton', 'Sách Ehon'])
    .default('Đồ chơi vận động'),
  surveyAnswers: z.record(z.any()).optional(),
  utmSource: z.string().trim().max(50).optional().default('direct'),
  utmMedium: z.string().trim().max(50).optional().default('web'),
  utmCampaign: z.string().trim().max(50).optional().default('mvp_launch'),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Vui lòng đồng ý Chính sách bảo mật để tiếp tục.' }),
  }),
});

/**
 * GET /api/waitlist/entries
 * Admin-only: View list of registered waitlist entries with pagination
 */
router.get('/entries', requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      Waitlist.find({})
        .sort({ orderNumber: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Waitlist.countDocuments({}),
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      entries,
    });
  } catch (err: any) {
    console.error('Waitlist entries error:', err);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi tải danh sách chờ.' });
  }
});

/**
 * GET /api/waitlist/test-email
 * Diagnostic endpoint to test live email delivery directly (Admin only)
 */
router.get('/test-email', requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const targetEmail = req.query.to as string;
  if (!targetEmail) {
    res.status(400).json({ error: 'Vui lòng cung cấp query parameter ?to=email@domain.com' });
    return;
  }
  try {
    const result = await sendWaitlistWelcomeEmail(targetEmail, 1, '0905123456', 'mom', 'Đồ chơi vận động');
    res.json({ success: true, targetEmail, result });
  } catch (err: any) {
    console.error('Waitlist test-email error:', err);
    res.status(500).json({ success: false, error: 'Lỗi khi gửi email thử nghiệm.' });
  }
});

/**
 * POST /api/waitlist/reset
 * Reset waitlist counter and entries back to 0 (Admin only)
 */
router.post('/reset', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Waitlist.deleteMany({});
    await Counter.updateOne({ _id: 'waitlist' }, { $set: { seq: 0 } }, { upsert: true });
    res.json({ success: true, count: 0, message: 'Đã thiết lập lại danh sách chờ về 0.' });
  } catch (err: any) {
    console.error('Waitlist reset error:', err);
    res.status(500).json({ success: false, error: 'Lỗi khi thiết lập lại danh sách chờ.' });
  }
});

/**
 * GET /api/waitlist/stats
 * Get current waitlist milestone progress (target: 200)
 */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const realCount = await Waitlist.countDocuments({});
    const total = realCount;
    const target = 200;
    const foundingRemaining = Math.max(0, target - total);
    const percentage = Math.min(100, Math.round((Math.min(target, total) / target) * 100));

    res.json({
      success: true,
      total,
      target,
      remaining: foundingRemaining,
      foundingRemaining,
      percentage,
      realCount,
      data: {
        total,
        target,
        remaining: foundingRemaining,
        foundingRemaining,
        percentage,
        realCount,
      },
    });
  } catch (error) {
    console.error('Waitlist stats error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi tải thống kê.' });
  }
});

/**
 * POST /api/waitlist
 * Register user for early-access waitlist and send confirmation email
 */
router.post('/', waitlistSubmitLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = WaitlistSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ';
      res.status(400).json({
        success: false,
        error: firstError,
        message: firstError,
      });
      return;
    }

    const { email, phone, userRole, interest, surveyAnswers, utmSource, utmMedium, utmCampaign } = parseResult.data;
    const cleanPhone = phone ? phone.replace(/[\s.-]/g, '') : '';
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';

    // Check if email already registered (Prevent duplicate emails & prevent email enumeration)
    const existing = await Waitlist.findOne({ email });
    if (existing) {
      const realCount = await Waitlist.countDocuments({});
      const total = realCount;
      const target = 200;
      const foundingRemaining = Math.max(0, target - total);
      const percentage = Math.min(100, Math.round((Math.min(target, total) / target) * 100));

      // DO NOT resend email to prevent spamming
      res.json({
        success: true,
        alreadyRegistered: true,
        emailDispatched: false,
        message: 'Email này đã có trong danh sách chờ nhận thông báo.',
        total,
        target,
        remaining: foundingRemaining,
        foundingRemaining,
        percentage,
        data: {
          total,
          target,
          remaining: foundingRemaining,
          foundingRemaining,
          percentage,
        },
      });
      return;
    }

    // Atomic increment sequence number using Counter model
    const counter = await Counter.findOneAndUpdate(
      { _id: 'waitlist' },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const newOrderNumber = counter ? counter.seq : 1;
    const isFounding = newOrderNumber <= 200;
    const target = 200;

    const newEntry = await Waitlist.create({
      email,
      phone: cleanPhone,
      userRole,
      interest,
      surveyAnswers: surveyAnswers || undefined,
      ip: clientIp,
      utmSource,
      utmMedium,
      utmCampaign,
      orderNumber: newOrderNumber,
      foundingMember: isFounding,
      consentAt: new Date(),
      consentVersion: '2026-10',
      xuClaimed: false,
    });

    // Check if active email provider configured
    const emailConfigured = isEmailConfigured();
    if (emailConfigured) {
      sendWaitlistWelcomeEmail(email, newOrderNumber, cleanPhone, userRole, interest).catch((err) => {
        console.warn(`[WAITLIST] Background email dispatch notice for ${email}:`, err?.message);
      });
    }

    const realCount = await Waitlist.countDocuments({});
    const total = realCount;
    const foundingRemaining = Math.max(0, target - total);
    const percentage = Math.min(100, Math.round((Math.min(target, total) / target) * 100));

    const successMessage = isFounding
      ? `Chúc mừng mẹ/bạn! Đã giữ chỗ thành công thành viên thứ #${newEntry.orderNumber} nhận 5 Xu Tiên Phong. Thư xác nhận đã được gửi đến email ${email}!`
      : `Đã hết 200 suất 5 Xu Tiên Phong, nhưng mẹ/bạn vẫn sẽ là những người đầu tiên được thông báo khi Kindr mở cửa!`;

    res.status(201).json({
      success: true,
      alreadyRegistered: false,
      emailDispatched: emailConfigured,
      foundingMember: isFounding,
      orderNumber: newEntry.orderNumber,
      message: successMessage,
      total,
      target,
      remaining: foundingRemaining,
      foundingRemaining,
      percentage,
      data: {
        orderNumber: newEntry.orderNumber,
        foundingMember: isFounding,
        total,
        target,
        remaining: foundingRemaining,
        foundingRemaining,
        percentage,
      },
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.json({
        success: true,
        alreadyRegistered: true,
        emailDispatched: false,
        message: 'Email này đã có trong danh sách chờ nhận thông báo.',
      });
      return;
    }
    console.error('Waitlist registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi hệ thống khi đăng ký danh sách chờ.',
      message: 'Lỗi hệ thống khi đăng ký danh sách chờ.',
    });
  }
});

export default router;
