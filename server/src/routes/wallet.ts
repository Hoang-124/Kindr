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
import { sendPushToUser } from '../services/pushNotificationService';

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
 * POST /api/wallet/create-order
 * Create a pending TopupOrder with dynamic VietQR code for real banking transfer
 */
router.post('/create-order', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
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
    const bankName = 'MBBank';
    const accountNumber = '0905123456';
    const accountHolder = 'CONG DONG KINDR';
    const vietqrUrl = `https://img.vietqr.io/image/MB-${accountNumber}-compact.png?amount=${vndAmount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountHolder)}`;

    const order = await TopupOrder.create({
      orderCode,
      userId: user._id,
      userName: user.name,
      userPhone: user.phone,
      xuAmount,
      vndAmount,
      memo,
      vietqrUrl,
      bankName,
      accountNumber,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Đã tạo đơn nạp Xu thành công. Vui lòng chuyển khoản theo mã VietQR bên dưới.',
      order: {
        orderCode: order.orderCode,
        xuAmount: order.xuAmount,
        vndAmount: order.vndAmount,
        memo: order.memo,
        vietqrUrl: order.vietqrUrl,
        bankName: order.bankName,
        accountNumber: order.accountNumber,
        accountHolder,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Create topup order error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi tạo đơn nạp Xu.' });
  }
});

/**
 * GET /api/wallet/orders/:orderCode/status
 * Check status of a specific topup order (polling fallback for client)
 */
router.get('/orders/:orderCode/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await TopupOrder.findOne({ orderCode: req.params.orderCode, userId: req.userId });
    if (!order) {
      res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
      return;
    }
    res.json({
      orderCode: order.orderCode,
      status: order.status,
      xuAmount: order.xuAmount,
      vndAmount: order.vndAmount,
      completedAt: order.completedAt,
    });
  } catch (error) {
    console.error('Get order status error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * POST /api/wallet/topup
 * Immediate simulated topup (useful for test/demo mode)
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
 * Universal Webhook receiver for automated banking (SePay / Casso / PayOS / VietQR IPN).
 * Verifies secret header/key and credits Xu atomically upon real incoming bank transfer.
 */
router.post('/webhook', async (req, res): Promise<void> => {
  try {
    const webhookSecret = req.headers['x-webhook-secret'] ||
      req.headers['authorization'] ||
      req.query.secret ||
      req.body?.secret ||
      req.body?.apiKey;

    // Check against configured ENV.WEBHOOK_SECRET
    if (webhookSecret !== ENV.WEBHOOK_SECRET && webhookSecret !== `Bearer ${ENV.WEBHOOK_SECRET}`) {
      res.status(401).json({ error: 'Webhook secret không hợp lệ.' });
      return;
    }

    const body = req.body || {};

    // 1. Extract raw transfer info supporting SePay, Casso, PayOS, and Generic formats
    let rawContent = '';
    let rawAmount = 0;
    let transactionRef = '';
    let gatewayName = 'unknown';

    if (body.gateway || body.transferType || body.accumulated !== undefined) {
      // SePay format
      gatewayName = body.gateway || 'sepay';
      rawContent = body.content || body.description || body.code || '';
      rawAmount = Number(body.transferAmount || body.amount || 0);
      transactionRef = String(body.referenceCode || body.id || body.code || '');
    } else if (Array.isArray(body.data) && body.data.length > 0) {
      // Casso format
      gatewayName = 'casso';
      const item = body.data[0];
      rawContent = item.description || '';
      rawAmount = Number(item.amount || 0);
      transactionRef = String(item.tid || item.id || '');
    } else if (body.data && (body.data.orderCode || body.data.reference)) {
      // PayOS format
      gatewayName = 'payos';
      rawContent = body.data.description || '';
      rawAmount = Number(body.data.amount || 0);
      transactionRef = String(body.data.reference || body.data.orderCode || '');
    } else {
      // Direct / Generic format
      gatewayName = body.gatewayName || 'vietqr';
      rawContent = body.content || body.memo || body.orderCode || body.description || '';
      rawAmount = Number(body.amount || body.vndAmount || body.transferAmount || 0);
      transactionRef = String(body.transactionRef || body.referenceCode || Date.now());
    }

    // 2. Find target orderCode: either exact body.orderCode or regex match TOPUP_...
    let targetOrderCode = body.orderCode ? String(body.orderCode).toUpperCase() : '';
    if (!targetOrderCode) {
      const match = rawContent.match(/TOPUP_\d+_[A-Z0-9]+/i);
      if (match) {
        targetOrderCode = match[0].toUpperCase();
      }
    }

    if (!targetOrderCode) {
      res.status(400).json({ error: 'Không tìm thấy mã đơn hàng TOPUP_... trong nội dung giao dịch.' });
      return;
    }

    // 3. Find order in MongoDB
    const order = await TopupOrder.findOne({ orderCode: targetOrderCode });
    if (!order) {
      res.status(404).json({ error: `Không tìm thấy đơn hàng với mã ${targetOrderCode}.` });
      return;
    }

    // Idempotency: If already completed, return 200 OK without re-crediting
    if (order.status === 'completed') {
      res.status(200).json({
        success: true,
        message: 'Đơn nạp Xu đã được xử lý trước đó (idempotent).',
        order,
      });
      return;
    }

    // 4. Verify amount (if amount provided in webhook, ensure >= order.vndAmount)
    if (rawAmount > 0 && rawAmount < order.vndAmount) {
      res.status(400).json({
        error: `Số tiền chuyển khoản (${rawAmount}đ) không đủ so với giá trị đơn hàng (${order.vndAmount}đ).`,
      });
      return;
    }

    // 5. Atomic CAS: transition from 'pending' to 'completed'
    const completedOrder = await TopupOrder.findOneAndUpdate(
      { _id: order._id, status: 'pending' },
      {
        $set: {
          status: 'completed',
          transactionRef: transactionRef || 'BANK_' + Date.now(),
          gatewayName,
          rawWebhookPayload: body,
          completedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!completedOrder) {
      res.status(400).json({ error: 'Đơn nạp Xu đã được xử lý trước đó.' });
      return;
    }

    // 6. Credit Xu to user
    const updatedUser = await User.findByIdAndUpdate(
      completedOrder.userId,
      { $inc: { xuBalance: completedOrder.xuAmount } },
      { new: true }
    );

    // 7. Notification + Socket.IO + Push Notification
    const notif = await Notification.create({
      userId: completedOrder.userId,
      type: 'xu_released',
      title: 'Nạp Xu Tự Động Thành Công! 🟡',
      body: `Hệ thống vừa nhận được chuyển khoản ngân hàng. Đã cộng +${completedOrder.xuAmount} Xu vào ví của bạn. Số dư mới: ${updatedUser?.xuBalance} Xu.`,
    });
    emitToUser(completedOrder.userId.toString(), 'notification_new', notif);

    // Dedicated realtime event for TopUpScreen
    emitToUser(completedOrder.userId.toString(), 'topup_success', {
      orderCode: completedOrder.orderCode,
      xuAmount: completedOrder.xuAmount,
      newBalance: updatedUser?.xuBalance,
    });

    // Send background Push Notification via Expo Push
    await sendPushToUser(completedOrder.userId, {
      title: 'Nạp Xu Tự Động Thành Công! 🟡',
      body: `Đã cộng +${completedOrder.xuAmount} Xu vào ví từ chuyển khoản ngân hàng.`,
      data: { type: 'topup_success', orderCode: completedOrder.orderCode },
    });

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
