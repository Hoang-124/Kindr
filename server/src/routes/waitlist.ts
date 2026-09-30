// server/src/routes/waitlist.ts
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Waitlist } from '../models/Waitlist';

const router = Router();

const WaitlistSchema = z.object({
  email: z.string().email('Địa chỉ email không hợp lệ'),
  phone: z.string().optional().default(''),
  utmSource: z.string().optional().default('direct'),
  utmMedium: z.string().optional().default('web'),
  utmCampaign: z.string().optional().default('mvp_launch'),
});

const BASE_OFFSET = 142; // Base offset to simulate community traction towards 200 milestone

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
    });
  } catch (error) {
    console.error('Waitlist stats error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi tải thống kê.' });
  }
});

/**
 * POST /api/waitlist
 * Register user for early-access waitlist (Step 5)
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = WaitlistSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' });
      return;
    }

    const { email, phone, utmSource, utmMedium, utmCampaign } = parseResult.data;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';

    // Check if email already registered
    const existing = await Waitlist.findOne({ email });
    if (existing) {
      const realCount = await Waitlist.countDocuments({});
      res.json({
        success: true,
        alreadyRegistered: true,
        message: `Mẹ đã đăng ký danh sách chờ trước đó rồi nhé! Mẹ giữ số thứ tự ưu đãi #${existing.orderNumber}.`,
        orderNumber: existing.orderNumber,
        total: Math.min(200, BASE_OFFSET + realCount),
      });
      return;
    }

    const realCount = await Waitlist.countDocuments({});
    const newOrderNumber = Math.min(200, BASE_OFFSET + realCount + 1);

    const newEntry = await Waitlist.create({
      email,
      phone,
      ip: clientIp,
      utmSource,
      utmMedium,
      utmCampaign,
      orderNumber: newOrderNumber,
    });

    res.status(201).json({
      success: true,
      alreadyRegistered: false,
      message: `Chúc mừng mẹ! Mẹ là thành viên thứ #${newEntry.orderNumber} trong danh sách chờ nhận 50 Xu chào mừng & quà tặng ngày ra mắt!`,
      orderNumber: newEntry.orderNumber,
      total: newOrderNumber,
    });
  } catch (error) {
    console.error('Waitlist registration error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi đăng ký danh sách chờ.' });
  }
});

export default router;
