// server/src/routes/wallet.ts
// ========================================
// WALLET, TOP-UP & WITHDRAW ROUTES
// ========================================
import { Router, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { WithdrawRequest } from '../models/WithdrawRequest';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// ---- Validation Schemas ----

const TopupSchema = z.object({
  xuAmount: z.number().min(1, 'Số Xu nạp tối thiểu là 1 Xu').max(500, 'Số Xu nạp tối đa là 500 Xu'),
});

const WithdrawSchema = z.object({
  xuAmount: z.number().min(1, 'Số Xu rút tối thiểu là 1 Xu'),
  bankName: z.string().min(2, 'Tên ngân hàng không hợp lệ'),
  accountNumber: z.string().min(5, 'Số tài khoản không hợp lệ'),
  accountHolder: z.string().min(2, 'Tên chủ tài khoản không hợp lệ'),
});

// ---- Routes ----

/**
 * GET /api/wallet/balance
 * Get current balance, frozen balance, and welcome credit
 */
router.get('/balance', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
      return;
    }

    res.json({
      xuBalance: user.xuBalance,
      xuFrozen: user.xuFrozen,
      welcomeCreditRemaining: user.welcomeCreditRemaining,
      totalXu: user.xuBalance + user.xuFrozen,
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy số dư ví.' });
  }
});

/**
 * POST /api/wallet/topup
 * Top up Xu via VietQR simulation
 */
router.post('/topup', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = TopupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { xuAmount } = parsed.data;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'Tài khoản không tồn tại.' });
      return;
    }

    // In demo/MVP, we credit directly and generate dynamic VietQR transfer link
    user.xuBalance += xuAmount;
    await user.save();

    const vndAmount = xuAmount * 10000;
    const memo = `KINDR ${user.phone} NAP ${xuAmount}XU`;
    const vietqrUrl = `https://img.vietqr.io/image/MB-0905123456-compact.png?amount=${vndAmount}&addInfo=${encodeURIComponent(
      memo
    )}`;

    res.json({
      message: `Nạp thành công ${xuAmount} Xu vào ví!`,
      newBalance: user.xuBalance,
      vietqrUrl,
      vndAmount,
    });
  } catch (error) {
    console.error('Topup error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi nạp Xu.' });
  }
});

/**
 * POST /api/wallet/withdraw
 * Create withdraw request (deducts 10% platform fee)
 */
router.post('/withdraw', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = WithdrawSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { xuAmount, bankName, accountNumber, accountHolder } = parsed.data;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'Tài khoản không tồn tại.' });
      return;
    }

    const withdrawableXu = Math.max(0, user.xuBalance - (user.welcomeCreditRemaining || 0));

    if (xuAmount > withdrawableXu) {
      if (user.welcomeCreditRemaining > 0 && user.xuBalance >= xuAmount) {
        res.status(400).json({
          error: `Số dư có thể rút là ${withdrawableXu} Xu. ${user.welcomeCreditRemaining} Xu quà tặng chào mừng chỉ dùng để đổi đồ trên sàn, không thể rút thành tiền mặt.`,
        });
        return;
      }
      res.status(400).json({
        error: `Số dư khả dụng (${withdrawableXu} Xu) không đủ để rút ${xuAmount} Xu.`,
      });
      return;
    }

    const vndAmount = xuAmount * 10000;
    const feeVnd = Math.round(vndAmount * 0.1); // 10% cash-out fee
    const payoutVnd = vndAmount - feeVnd;

    // Deduct Xu balance immediately
    user.xuBalance -= xuAmount;
    await user.save();

    const withdrawRequest = await WithdrawRequest.create({
      userId: user._id,
      userName: user.name,
      xuAmount,
      vndAmount,
      feeVnd,
      payoutVnd,
      bankName,
      accountNumber,
      accountHolder: accountHolder.toUpperCase(),
      status: 'pending',
    });

    res.status(201).json({
      message: `Đã tạo yêu cầu rút ${xuAmount} Xu (${payoutVnd.toLocaleString('vi-VN')}đ thực nhận). BQT Kindr sẽ xử lý trong 24h.`,
      withdrawRequest,
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi tạo yêu cầu rút Xu.' });
  }
});

/**
 * GET /api/wallet/history
 * Get withdraw history
 */
router.get('/history', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const withdrawRequests = await WithdrawRequest.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ withdrawRequests });
  } catch (error) {
    console.error('Get wallet history error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy lịch sử ví.' });
  }
});

export default router;
