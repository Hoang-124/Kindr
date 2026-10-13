// server/src/routes/survey.ts
// Pop-up booth QR survey: 5 quick questions -> 5 Xu Tan Thu reward code.
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import {
  PopupSurvey,
  SURVEY_CAMPAIGNS,
  SURVEY_MOTIVATIONS,
  SURVEY_REFERRAL_INTENTS,
  SurveyCampaign,
} from '../models/PopupSurvey';
import { Counter } from '../models/Counter';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { ENV } from '../config/env';

const router = Router();

/** Business constants for the FPT Plaza pop-up (0đ incentives) */
export const POPUP_STARTER_XU = 5;
export const POPUP_SAFE_FEE_WAIVER_SLOTS = 50;
export const POPUP_SAFE_FEE_WAIVER_POSTS = 3;

const surveyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => ENV.NODE_ENV === 'test',
  message: { success: false, error: 'Bạn đã gửi khảo sát quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const SurveySchema = z.object({
  campaign: z.enum(SURVEY_CAMPAIGNS).default('fpt_plaza_popup'),
  phone: z
    .string({ required_error: 'Vui lòng nhập số điện thoại để nhận 5 Xu' })
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ''))
    .refine((v) => /^(0[35789])[0-9]{8}$/.test(v), 'Số điện thoại phải là 10 chữ số Việt Nam hợp lệ (ví dụ: 0905123456)'),
  hasItemsToDeclutter: z.boolean({ required_error: 'Vui lòng trả lời câu 1' }),
  motivation: z.enum(SURVEY_MOTIVATIONS, { errorMap: () => ({ message: 'Vui lòng trả lời câu 2' }) }),
  fearsFacebookScams: z.boolean({ required_error: 'Vui lòng trả lời câu 3' }),
  findsAppUseful: z.boolean({ required_error: 'Vui lòng trả lời câu 4' }),
  referralIntent: z.enum(SURVEY_REFERRAL_INTENTS, { errorMap: () => ({ message: 'Vui lòng trả lời câu 5' }) }),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Vui lòng đồng ý Chính sách bảo mật để nhận ưu đãi.' }),
  }),
});

export const ClaimSchema = z.object({
  campaign: z.enum(SURVEY_CAMPAIGNS).default('fpt_plaza_popup'),
  phone: z
    .string({ required_error: 'Vui lòng nhập số điện thoại để nhận 5 Xu' })
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ''))
    .refine((v) => /^(0[35789])[0-9]{8}$/.test(v), 'Số điện thoại phải là 10 chữ số Việt Nam hợp lệ (ví dụ: 0905123456)'),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Vui lòng đồng ý Chính sách bảo mật để nhận ưu đãi.' }),
  }),
});

export const AnswersSchema = z.object({
  campaign: z.enum(SURVEY_CAMPAIGNS).default('fpt_plaza_popup'),
  phone: z
    .string({ required_error: 'Thiếu số điện thoại' })
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ''))
    .refine((v) => /^(0[35789])[0-9]{8}$/.test(v), 'Số điện thoại không hợp lệ'),
  hasItemsToDeclutter: z.boolean().optional(),
  motivation: z.enum(SURVEY_MOTIVATIONS).optional(),
  fearsFacebookScams: z.boolean().optional(),
  findsAppUseful: z.boolean().optional(),
  referralIntent: z.enum(SURVEY_REFERRAL_INTENTS).optional(),
});

function generateRewardCode(): string {
  // Unambiguous alphabet (no 0/O/1/I)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[bytes[i] % alphabet.length];
  return `POP-${code}`;
}

async function buildStats(campaign: SurveyCampaign) {
  const total = await PopupSurvey.countDocuments({ campaign });
  return {
    total,
    waiverSlots: POPUP_SAFE_FEE_WAIVER_SLOTS,
    waiverRemaining: Math.max(0, POPUP_SAFE_FEE_WAIVER_SLOTS - total),
  };
}

/**
 * GET /api/survey/stats?campaign=fpt_plaza_popup
 * Public: number of responses + remaining Safe Fee waiver slots
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = z.enum(SURVEY_CAMPAIGNS).safeParse(req.query.campaign ?? 'fpt_plaza_popup');
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Chiến dịch không hợp lệ' });
      return;
    }
    res.json({ success: true, data: await buildStats(parsed.data) });
  } catch (err) {
    console.error('Survey stats error:', err);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi tải thống kê khảo sát.' });
  }
});

/**
 * GET /api/survey/summary?campaign=fpt_plaza_popup
 * Admin-only: aggregated answer breakdown for campaign insight
 */
router.get('/summary', requireAuth, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = z.enum(SURVEY_CAMPAIGNS).safeParse(req.query.campaign ?? 'fpt_plaza_popup');
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Chiến dịch không hợp lệ' });
      return;
    }
    const campaign = parsed.data;
    const [agg] = await PopupSurvey.aggregate([
      { $match: { campaign } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          hasItemsToDeclutter: { $sum: { $cond: ['$hasItemsToDeclutter', 1, 0] } },
          fearsFacebookScams: { $sum: { $cond: ['$fearsFacebookScams', 1, 0] } },
          findsAppUseful: { $sum: { $cond: ['$findsAppUseful', 1, 0] } },
          willingToRefer: { $sum: { $cond: [{ $eq: ['$referralIntent', 'willing'] }, 1, 0] } },
          saveMoney: { $sum: { $cond: [{ $eq: ['$motivation', 'save_money'] }, 1, 0] } },
          declutter: { $sum: { $cond: [{ $eq: ['$motivation', 'declutter'] }, 1, 0] } },
          newItems: { $sum: { $cond: [{ $eq: ['$motivation', 'new_items'] }, 1, 0] } },
        },
      },
      { $project: { _id: 0 } },
    ]);
    res.json({ success: true, data: agg ?? { total: 0 } });
  } catch (err) {
    console.error('Survey summary error:', err);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi tổng hợp khảo sát.' });
  }
});

/**
 * POST /api/survey
 * Submit 5-question pop-up survey. Idempotent per phone+campaign.
 */
router.post('/', surveyLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = SurveySchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ';
      res.status(400).json({ success: false, error: msg });
      return;
    }
    const { consent: _consent, ...answers } = parsed.data;
    const { campaign, phone } = answers;

    const existing = await PopupSurvey.findOne({ campaign, phone }).lean<{ rewardCode: string; safeFeeWaiver: boolean }>();
    if (existing) {
      res.json({
        success: true,
        alreadySubmitted: true,
        message: 'Số điện thoại này đã nhận ưu đãi khảo sát trước đó.',
        data: {
          rewardCode: existing.rewardCode,
          starterXu: POPUP_STARTER_XU,
          safeFeeWaiver: existing.safeFeeWaiver,
          ...(await buildStats(campaign)),
        },
      });
      return;
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: `survey_${campaign}` },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const orderNumber = counter ? counter.seq : 1;
    const safeFeeWaiver = orderNumber <= POPUP_SAFE_FEE_WAIVER_SLOTS;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';

    const doc = await PopupSurvey.create({
      ...answers,
      rewardCode: generateRewardCode(),
      starterXu: POPUP_STARTER_XU,
      safeFeeWaiver,
      orderNumber,
      ip: clientIp,
      consentAt: new Date(),
    });

    res.status(201).json({
      success: true,
      alreadySubmitted: false,
      message: safeFeeWaiver
        ? `Cảm ơn mẹ! Nhận ${POPUP_STARTER_XU} Xu Tân Thủ + Miễn Safe Fee cho ${POPUP_SAFE_FEE_WAIVER_POSTS} bài đăng đầu.`
        : `Cảm ơn mẹ! Nhận ${POPUP_STARTER_XU} Xu Tân Thủ vào ví khi kích hoạt app.`,
      data: {
        rewardCode: doc.rewardCode,
        starterXu: POPUP_STARTER_XU,
        safeFeeWaiver,
        orderNumber,
        ...(await buildStats(campaign)),
      },
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ success: false, error: 'Khảo sát đang được xử lý, mẹ vui lòng thử lại.' });
      return;
    }
    console.error('Survey submit error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi gửi khảo sát.' });
  }
});

/**
 * POST /api/survey/claim
 * Phase 1 (Fast Claim): Register phone, instantly get 5 Xu rewardCode + reserve spot.
 */
router.post('/claim', surveyLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = ClaimSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || 'Số điện thoại không hợp lệ';
      res.status(400).json({ success: false, error: msg });
      return;
    }
    const { campaign, phone } = parsed.data;

    const existing = await PopupSurvey.findOne({ campaign, phone }).lean<{ rewardCode: string; safeFeeWaiver: boolean; starterXu: number }>();
    if (existing) {
      res.json({
        success: true,
        alreadySubmitted: true,
        message: 'Số điện thoại này đã nhận ưu đãi 5 Xu trước đó.',
        data: {
          rewardCode: existing.rewardCode,
          starterXu: existing.starterXu || POPUP_STARTER_XU,
          safeFeeWaiver: existing.safeFeeWaiver,
          ...(await buildStats(campaign)),
        },
      });
      return;
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: `survey_${campaign}` },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    const orderNumber = counter ? counter.seq : 1;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';

    const doc = await PopupSurvey.create({
      campaign,
      phone,
      rewardCode: generateRewardCode(),
      starterXu: POPUP_STARTER_XU,
      safeFeeWaiver: false,
      orderNumber,
      ip: clientIp,
      consentAt: new Date(),
    });

    res.status(201).json({
      success: true,
      alreadySubmitted: false,
      message: `Chào mừng mẹ! Đã bảo lưu ${POPUP_STARTER_XU} Xu Tân Thủ vào ví tài khoản.`,
      data: {
        rewardCode: doc.rewardCode,
        starterXu: doc.starterXu,
        safeFeeWaiver: doc.safeFeeWaiver,
        orderNumber: doc.orderNumber,
        ...(await buildStats(campaign)),
      },
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ success: false, error: 'Yêu cầu đang xử lý, vui lòng thử lại.' });
      return;
    }
    console.error('Survey claim error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi nhận ưu đãi.' });
  }
});

/**
 * POST /api/survey/answers
 * Phase 2 (Optional survey): Answer questions to unlock 100% Safe Fee waiver perk.
 */
router.post('/answers', surveyLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = AnswersSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ';
      res.status(400).json({ success: false, error: msg });
      return;
    }
    const { campaign, phone, ...answers } = parsed.data;

    const doc = await PopupSurvey.findOne({ campaign, phone });
    if (!doc) {
      res.status(404).json({ success: false, error: 'Chưa tìm thấy đăng ký của số điện thoại này. Mẹ vui lòng nhận 5 Xu trước nhé!' });
      return;
    }

    if (answers.hasItemsToDeclutter !== undefined) doc.hasItemsToDeclutter = answers.hasItemsToDeclutter;
    if (answers.motivation !== undefined) doc.motivation = answers.motivation;
    if (answers.fearsFacebookScams !== undefined) doc.fearsFacebookScams = answers.fearsFacebookScams;
    if (answers.findsAppUseful !== undefined) doc.findsAppUseful = answers.findsAppUseful;
    if (answers.referralIntent !== undefined) doc.referralIntent = answers.referralIntent;

    // Grant Safe Fee Waiver for answering the survey!
    doc.safeFeeWaiver = true;
    await doc.save();

    res.json({
      success: true,
      message: 'Đã mở khóa thành công Suất Miễn 100% Phí Bảo Đảm!',
      data: {
        rewardCode: doc.rewardCode,
        starterXu: doc.starterXu,
        safeFeeWaiver: doc.safeFeeWaiver,
        orderNumber: doc.orderNumber,
        ...(await buildStats(campaign)),
      },
    });
  } catch (error: any) {
    console.error('Survey answers error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống khi lưu câu trả lời khảo sát.' });
  }
});

export default router;
