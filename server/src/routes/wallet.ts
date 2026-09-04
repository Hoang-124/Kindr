// server/src/routes/wallet.ts
// ========================================
// WALLET, TOP-UP & WITHDRAW ROUTES
// ========================================
import { Router, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { TopupOrder } from '../models/TopupOrder';
import { Notification } from '../models/Notification';
import { emitToUser } from '../socket';
import { WithdrawRequest } from '../models/WithdrawRequest';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { ENV } from '../config/env';

const router = Router();

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

    const vndAmount = xuAmount * 10000;
    const orderCode = `TOPUP_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const memo = `KINDR NAP ${xuAmount}XU ${orderCode}`;
    const vietqrUrl = `https://img.vietqr.io/image/MB-0905123456-compact.png?amount=${vndAmount}&addInfo=${encodeURIComponent(memo)}`;

    // Create cloud TopupOrder in MongoDB
    const order = await TopupOrder.create({
      orderCode,
      userId: user._id,
      userName: user.name,
      userPhone: user.phone,
      xuAmount,
      vndAmount,
      memo,
      vietqrUrl,
      status: 'completed',
      completedAt: new Date(),
    });

    user.xuBalance += xuAmount;
    await user.save();

    res.json({
      message: `Nạp thành công ${xuAmount} Xu vào ví!`,
      newBalance: user.xuBalance,
      vietqrUrl,
      vndAmount,
      order,
    });
  } catch (error) {
    console.error('Topup error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi nạp Xu.' });
  }
});

/**
 * POST /api/wallet/webhook
 * Secure webhook receiver for banking automation (SePay / Casso / VietQR IPN).
 * Verifies secret header/key and credits Xu atomically upon real incoming bank transfer.
 */
router.post('/webhook', async (req, res): Promise<void> => {
  try {
    const webhookSecret = req.headers['x-webhook-secret'] || req.query.secret;
    if (webhookSecret !== ENV.WEBHOOK_SECRET) {
      res.status(401).json({ error: 'Webhook secret không hợp lệ.' });
      return;
    }

    const { orderCode, content, transactionRef } = req.body || {};

    let order = null;
    if (orderCode) {
      order = await TopupOrder.findOne({ orderCode, status: 'pending' });
    } else if (content) {
      const match = content.match(/TOPUP_\d+_[A-Z0-9]+/i);
      if (match) {
        order = await TopupOrder.findOne({ orderCode: match[0], status: 'pending' });
      }
    }

    if (!order) {
      res.status(404).json({ error: 'Không tìm thấy đơn nạp Xu tương ứng hoặc đơn đã được xử lý.' });
      return;
    }

    // Atomic CAS: transition from 'pending' to 'completed'
    const completedOrder = await TopupOrder.findOneAndUpdate(
      { _id: order._id, status: 'pending' },
      {
        $set: {
          status: 'completed',
          transactionRef: transactionRef || 'BANK_' + Date.now(),
          completedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!completedOrder) {
      res.status(400).json({ error: 'Đơn nạp Xu đã được xử lý trước đó.' });
      return;
    }

    // Credit Xu to user
    const updatedUser = await User.findByIdAndUpdate(
      completedOrder.userId,
      { $inc: { xuBalance: completedOrder.xuAmount } },
      { new: true }
    );

    // Push notification to user
    const notif = await Notification.create({
      userId: completedOrder.userId,
      type: 'xu_released',
      title: 'Biến động số dư: Nạp Xu thành công! 🟡',
      body: `Hệ thống đã nhận được chuyển khoản. Đã cộng ${completedOrder.xuAmount} Xu vào ví của bạn. Số dư mới: ${updatedUser?.xuBalance} Xu.`,
    });
    emitToUser(completedOrder.userId.toString(), 'notification_new', notif);

    res.json({
      success: true,
      message: `Đã xử lý nạp ${completedOrder.xuAmount} Xu thành công!`,
      order: completedOrder,
    });
  } catch (error) {
    console.error('Wallet webhook error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi xử lý webhook ngân hàng.' });
  }
});

/**
 * GET /api/wallet/orders
 * Get current user's top-up orders from Cloud DB.
 */
router.get('/orders', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await TopupOrder.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ orders });
  } catch (error) {
    console.error('Get topup orders error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách đơn nạp.' });
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
