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

const BASE_OFFSET = 142; // Base offset representing early founding seed traction towards 200 milestone

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

      // Asynchronously send/resend email confirmation
      sendWaitlistWelcomeEmail(email, existing.orderNumber, cleanPhone || existing.phone, userRole || existing.userRole, interest || existing.interest).catch(e => {
        console.warn(`[WAITLIST] Email resend warning for ${email}:`, e?.message);
      });

      res.json({
        success: true,
        alreadyRegistered: true,
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

    // Send personalized confirmation & thank-you email
    sendWaitlistWelcomeEmail(email, newOrderNumber, cleanPhone, userRole, interest).catch(e => {
      console.warn(`[WAITLIST] Welcome email dispatch warning for ${email}:`, e?.message);
    });

    res.status(201).json({
      success: true,
      alreadyRegistered: false,
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
