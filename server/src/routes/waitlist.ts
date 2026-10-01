// server/src/routes/waitlist.ts
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Waitlist } from '../models/Waitlist';
import { sendWaitlistWelcomeEmail } from '../services/emailService';

const router = Router();

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
      'Số điện thoại / Zalo phải là 10 chữ số Việt Nam hợp lệ (ví dụ: 0905123456)'
    ),
  userRole: z.string().optional().default('mother'),
  interest: z.string().optional().default('Đồ chơi vận động'),
  utmSource: z.string().optional().default('direct'),
  utmMedium: z.string().optional().default('web'),
  utmCampaign: z.string().optional().default('mvp_launch'),
});

const BASE_OFFSET = 0; // Starts from 0 on deployment, increments 1 by 1 per real registration

/**
 * GET /api/waitlist/test-email
 * Diagnostic endpoint to test live email delivery directly
 */
router.get('/test-email', async (req: Request, res: Response): Promise<void> => {
  const targetEmail = (req.query.to as string) || 'ht20041975@gmail.com';
  try {
    const result = await sendWaitlistWelcomeEmail(targetEmail, 1, '0905123456', 'mother', 'Đồ chơi vận động');
    res.json({ success: true, targetEmail, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/waitlist/reset
 * Reset waitlist counter back to 0
 */
router.post('/reset', async (_req: Request, res: Response): Promise<void> => {
  try {
    await Waitlist.deleteMany({});
    res.json({ success: true, count: 0, message: 'Đã thiết lập lại danh sách chờ về 0.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/waitlist/stats
 * Get current waitlist milestone progress (target: 200)
 */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const realCount = await Waitlist.countDocuments({});
    const total = Math.min(200, BASE_OFFSET + realCount);
    const target = 200;
    const remaining = Math.max(0, target - total);
    const percentage = Math.min(100, Math.round((total / target) * 100));

    res.json({
      total,
      target,
      remaining,
      percentage,
      realCount,
      data: {
        total,
        target,
        remaining,
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
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = WaitlistSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ';
      res.status(400).json({ 
        success: false,
        error: firstError,
        message: firstError 
      });
      return;
    }

    const { email, phone, userRole, interest, utmSource, utmMedium, utmCampaign } = parseResult.data;
    const cleanPhone = phone ? phone.replace(/[\s.-]/g, '') : '';
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';

    // Check if email already registered
    const existing = await Waitlist.findOne({ email });
    if (existing) {
      const realCount = await Waitlist.countDocuments({});
      const total = Math.min(200, BASE_OFFSET + realCount);
      const target = 200;
      const remaining = Math.max(0, target - total);
      const percentage = Math.min(100, Math.round((total / target) * 100));

      // Instant non-blocking email dispatch
      sendWaitlistWelcomeEmail(email, existing.orderNumber, cleanPhone || existing.phone, userRole || existing.userRole, interest || existing.interest).catch((err) => {
        console.warn(`[WAITLIST] Background email resend notice for ${email}:`, err?.message);
      });

      res.json({
        success: true,
        alreadyRegistered: true,
        emailDispatched: true,
        message: `Mẹ/bạn đã đăng ký giữ chỗ trước đó rồi nhé! Bạn đang giữ số thứ tự ưu đãi #${existing.orderNumber}. Thư xác nhận đã được gửi đến hòm thư ${email}.`,
        orderNumber: existing.orderNumber,
        total,
        target,
        remaining,
        percentage,
        data: {
          orderNumber: existing.orderNumber,
          total,
          target,
          remaining,
          percentage,
        },
      });
      return;
    }

    const realCount = await Waitlist.countDocuments({});
    const newOrderNumber = Math.min(200, BASE_OFFSET + realCount + 1);
    const target = 200;
    const remaining = Math.max(0, target - newOrderNumber);
    const percentage = Math.min(100, Math.round((newOrderNumber / target) * 100));

    const newEntry = await Waitlist.create({
      email,
      phone: cleanPhone,
      userRole,
      interest,
      ip: clientIp,
      utmSource,
      utmMedium,
      utmCampaign,
      orderNumber: newOrderNumber,
    });

    // Instant non-blocking email dispatch so UI responds in < 100ms
    sendWaitlistWelcomeEmail(email, newOrderNumber, cleanPhone, userRole, interest).catch((err) => {
      console.warn(`[WAITLIST] Background email dispatch notice for ${email}:`, err?.message);
    });

    res.status(201).json({
      success: true,
      alreadyRegistered: false,
      emailDispatched: true,
      message: `Chúc mừng mẹ/bạn! Đã giữ chỗ thành công thành viên thứ #${newEntry.orderNumber} nhận 5 Xu Tiên Phong. Thư xác nhận đã được gửi đến email ${email}!`,
      orderNumber: newEntry.orderNumber,
      total: newOrderNumber,
      target,
      remaining,
      percentage,
      data: {
        orderNumber: newEntry.orderNumber,
        total: newOrderNumber,
        target,
        remaining,
        percentage,
      },
    });
  } catch (error) {
    console.error('Waitlist registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi hệ thống khi đăng ký danh sách chờ.',
      message: 'Lỗi hệ thống khi đăng ký danh sách chờ.' 
    });
  }
});

export default router;
