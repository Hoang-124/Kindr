// server/src/routes/wallet.ts
// ========================================
// WALLET, TOP-UP & WITHDRAW ROUTES
// ========================================
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { TopupOrder } from '../models/TopupOrder';
import { PaymentOrder } from '../models/PaymentOrder';
import { Notification } from '../models/Notification';
import { emitToUser } from '../socket';
import { WithdrawRequest } from '../models/WithdrawRequest';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { ENV } from '../config/env';
import { sendPushToUser } from '../services/pushNotificationService';
import { payosService } from '../services/payosService';
import {
  getOrCreateWallet,
  recordWalletOrder,
  completeLandingTopup,
  updateEscrowLock,
} from '../services/landingWalletStore';

const router = Router();

const TopupSchema = z.object({
  xuAmount: z.number().min(1, 'Số Xu nạp tối thiểu là 1 Xu').max(500, 'Số Xu nạp tối đa là 500 Xu'),
});

const PayOSTopupSchema = z.object({
  xuAmount: z.number().int('Số Xu phải là số nguyên').min(1, 'Số Xu nạp tối thiểu là 1 Xu (1.000 VNĐ)').max(100000, 'Số Xu nạp tối đa là 100.000 Xu (100.000.000 VNĐ)'),
});

const WithdrawSchema = z.object({
  xuAmount: z.number().min(1, 'Số Xu rút tối thiểu là 1 Xu'),
  bankName: z.string().min(2, 'Tên ngân hàng không hợp lệ'),
  accountNumber: z.string().min(5, 'Số tài khoản không hợp lệ'),
  accountHolder: z.string().min(2, 'Tên chủ tài khoản không hợp lệ'),
});

/**
 * Helper: Atomic completion of a PayOS topup order
 * Guarantees Idempotency and atomic updates to User balance and Ledger
 */
async function completePaymentOrderAtomic(
  orderCode: number,
  webhookData?: any
): Promise<{ success: boolean; order?: any; user?: any; alreadyPaid?: boolean }> {
  const existingOrder = await PaymentOrder.findOne({ orderCode });
  if (!existingOrder) {
    return { success: false };
  }
  if (existingOrder.status === 'PAID') {
    return { success: true, order: existingOrder, alreadyPaid: true };
  }

  // Atomic CAS update: status from PENDING/EXPIRED to PAID
  const completedOrder = await PaymentOrder.findOneAndUpdate(
    { orderCode, status: { $ne: 'PAID' } },
    {
      $set: {
        status: 'PAID',
        paidAt: new Date(),
        ...(webhookData ? { webhookData } : {}),
      },
    },
    { new: true }
  );

  if (!completedOrder) {
    const checkOrder = await PaymentOrder.findOne({ orderCode });
    return { success: true, order: checkOrder, alreadyPaid: true };
  }

  // Sync with landing wallet json store if clientId is present
  try {
    completeLandingTopup(orderCode, completedOrder.paidAt || new Date());
    if (completedOrder.clientId) {
      emitToUser(completedOrder.clientId, 'wallet:topup_success', {
        orderCode: completedOrder.orderCode,
        xuAmount: completedOrder.xuAmount,
        vndAmount: completedOrder.vndAmount,
      });
    }
  } catch (err) {
    console.warn('Sync landing wallet store warning:', err);
  }

  // Credit user xuBalance atomically if user is attached
  let updatedUser = null;
  if (completedOrder.userId) {
    updatedUser = await User.findByIdAndUpdate(
      completedOrder.userId,
      { $inc: { xuBalance: completedOrder.xuAmount } },
      { new: true }
    );

    // Create in-app notification
    const notif = await Notification.create({
      userId: completedOrder.userId,
      type: 'topup_success',
      title: 'Nạp Xu PayOS Thành Công! 🎉',
      body: `Cổng PayOS đã xác nhận thanh toán ${completedOrder.vndAmount.toLocaleString('vi-VN')}đ (Mã GD: ${completedOrder.orderCode}). Đã cộng +${completedOrder.xuAmount} Xu vào ví của mẹ!`,
      data: {
        orderCode: completedOrder.orderCode,
        xuAmount: completedOrder.xuAmount,
        vndAmount: completedOrder.vndAmount,
      },
    });
    emitToUser(completedOrder.userId.toString(), 'notification_new', notif);

    // Emit Realtime Socket.IO events (support both event names)
    emitToUser(completedOrder.userId.toString(), 'wallet:topup_success', {
      orderCode: completedOrder.orderCode,
      xuAmount: completedOrder.xuAmount,
      vndAmount: completedOrder.vndAmount,
      newBalance: updatedUser?.xuBalance,
    });
    emitToUser(completedOrder.userId.toString(), 'topup_success', {
      orderCode: completedOrder.orderCode,
      xuAmount: completedOrder.xuAmount,
      newBalance: updatedUser?.xuBalance,
    });

    // Background Push Notification via Expo Push
    try {
      await sendPushToUser(completedOrder.userId, {
        title: 'Nạp Xu PayOS Thành Công! 🪙',
        body: `Đã cộng +${completedOrder.xuAmount} Xu vào ví từ chuyển khoản ngân hàng VietQR.`,
        data: { type: 'topup_success', orderCode: completedOrder.orderCode },
      });
    } catch (err) {
      console.warn('Push notification warning:', err);
    }
  }

  return { success: true, order: completedOrder, user: updatedUser, alreadyPaid: false };
}

// ---- Routes ----

/**
 * POST /api/wallet/topup/create-link
 * Tạo link thanh toán PayOS VietQR nạp Xu vào ví
 */
router.post('/topup/create-link', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = PayOSTopupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { xuAmount } = parsed.data;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'Tài khoản người dùng không tồn tại.' });
      return;
    }

    // 1 Xu = 1.000 VNĐ
    const vndAmount = xuAmount * 1000;

    // Sinh orderCode kiểu Number duy nhất an toàn (<= MAX_SAFE_INTEGER, chuẩn PayOS)
    const orderCode = Number(`${Date.now().toString().slice(-7)}${Math.floor(100 + Math.random() * 900)}`);
    const description = `KINDR NAP ${xuAmount} XU`.slice(0, 25);

    const paymentLink = await payosService.createPaymentLink({
      orderCode,
      amount: vndAmount,
      description,
      buyerName: user.name,
      buyerPhone: user.phone,
      buyerEmail: user.email,
    });

    const paymentOrder = await PaymentOrder.create({
      orderCode,
      userId: user._id,
      userName: user.name,
      userPhone: user.phone,
      type: 'TOPUP',
      xuAmount,
      vndAmount,
      status: 'PENDING',
      paymentLinkId: paymentLink.paymentLinkId,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      accountNumber: paymentLink.accountNumber,
      accountName: paymentLink.accountName,
      bin: paymentLink.bin,
      description: paymentLink.description,
    });

    res.status(201).json({
      success: true,
      message: 'Đã tạo link thanh toán VietQR thành công.',
      orderCode: paymentOrder.orderCode,
      xuAmount: paymentOrder.xuAmount,
      vndAmount: paymentOrder.vndAmount,
      checkoutUrl: paymentOrder.checkoutUrl,
      qrCode: paymentOrder.qrCode,
      accountNumber: paymentOrder.accountNumber,
      accountName: paymentOrder.accountName,
      bin: paymentOrder.bin,
      description: paymentOrder.description,
      status: paymentOrder.status,
    });
  } catch (error: any) {
    console.error('Create PayOS payment link error:', error);
    res.status(500).json({ error: error?.message || 'Lỗi hệ thống khi tạo link nạp tiền PayOS.' });
  }
});

/**
 * POST /api/wallet/topup/payos-webhook
 * Public Webhook endpoint nhận IPN callback từ PayOS
 */
router.post('/topup/payos-webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    let webhookData: any = null;
    try {
      webhookData = await payosService.verifyPaymentWebhookData(req.body);
    } catch (verifyErr: any) {
      console.error('❌ PayOS Webhook signature verification failed:', verifyErr.message);
      res.status(400).json({ error: 'Chữ ký webhook không hợp lệ.' });
      return;
    }

    if (!webhookData || !webhookData.orderCode) {
      res.status(400).json({ error: 'Dữ liệu webhook thiếu orderCode.' });
      return;
    }

    const orderCode = Number(webhookData.orderCode);
    console.log(`🔔 PayOS Webhook received for orderCode: ${orderCode}`);

    const result = await completePaymentOrderAtomic(orderCode, req.body);
    if (!result.success) {
      res.status(404).json({ error: 'Không tìm thấy đơn nạp tương ứng với orderCode.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.alreadyPaid ? 'Đơn hàng đã được thanh toán trước đó.' : 'Đã xác nhận thanh toán và cộng Xu thành công.',
      orderCode,
    });
  } catch (error) {
    console.error('PayOS Webhook error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi xử lý webhook PayOS.' });
  }
});

/**
 * GET /api/wallet/topup/status/:orderCode
 * Kiểm tra trạng thái đơn nạp PayOS (kết hợp tra cứu cổng PayOS nếu đang PENDING)
 */
router.get('/topup/status/:orderCode', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderCode = Number(req.params.orderCode);
    if (isNaN(orderCode)) {
      res.status(400).json({ error: 'Mã đơn hàng không hợp lệ.' });
      return;
    }

    const order = await PaymentOrder.findOne({ orderCode, userId: req.userId });
    if (!order) {
      res.status(404).json({ error: 'Không tìm thấy đơn nạp tiền.' });
      return;
    }

    // Nếu đơn vẫn PENDING, kiểm tra với PayOS server để đồng bộ
    if (order.status === 'PENDING') {
      try {
        const payosInfo = await payosService.getPaymentLinkInformation(orderCode);
        if (payosInfo && payosInfo.status === 'PAID') {
          const result = await completePaymentOrderAtomic(orderCode, payosInfo);
          res.json({
            orderCode: order.orderCode,
            status: 'PAID',
            xuAmount: order.xuAmount,
            vndAmount: order.vndAmount,
            paidAt: result.order?.paidAt || new Date(),
            checkoutUrl: order.checkoutUrl,
            qrCode: order.qrCode,
          });
          return;
        } else if (payosInfo && (payosInfo.status === 'CANCELLED' || payosInfo.status === 'EXPIRED')) {
          order.status = payosInfo.status;
          await order.save();
        }
      } catch (checkErr) {
        console.warn('PayOS status check sync error:', checkErr);
      }
    }

    res.json({
      orderCode: order.orderCode,
      status: order.status,
      xuAmount: order.xuAmount,
      vndAmount: order.vndAmount,
      paidAt: order.paidAt,
      checkoutUrl: order.checkoutUrl,
      qrCode: order.qrCode,
    });
  } catch (error) {
    console.error('Check PayOS topup status error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi kiểm tra trạng thái đơn nạp.' });
  }
});

/**
 * POST /api/wallet/topup/cancel/:orderCode
 * Hủy đơn nạp tiền đang PENDING
 */
router.post('/topup/cancel/:orderCode', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orderCode = Number(req.params.orderCode);
    if (isNaN(orderCode)) {
      res.status(400).json({ error: 'Mã đơn hàng không hợp lệ.' });
      return;
    }

    const order = await PaymentOrder.findOne({ orderCode, userId: req.userId });
    if (!order) {
      res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
      return;
    }

    if (order.status !== 'PENDING') {
      res.status(400).json({ error: `Không thể hủy đơn hàng ở trạng thái ${order.status}.` });
      return;
    }

    try {
      await payosService.cancelPaymentLink(orderCode, 'Người dùng hủy đơn nạp trên Kindr');
    } catch (cancelErr: any) {
      console.warn('PayOS cancelPaymentLink warning:', cancelErr?.message);
    }

    order.status = 'CANCELLED';
    await order.save();

    res.json({
      success: true,
      message: 'Đã hủy đơn nạp tiền thành công.',
      orderCode: order.orderCode,
      status: order.status,
    });
  } catch (error) {
    console.error('Cancel PayOS topup order error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi hủy đơn nạp.' });
  }
});

/**
 * POST /api/wallet/topup/simulate-success/:orderCode
 * Giả lập nạp tiền thành công cho Dev/Demo (chỉ chạy khi development hoặc ENABLE_DEMO_TOPUP=true)
 */
router.post('/topup/simulate-success/:orderCode', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  if (ENV.NODE_ENV !== 'development' && !ENV.ENABLE_DEMO_TOPUP) {
    res.status(403).json({ error: 'Chức năng chỉ hỗ trợ ở môi trường Development / Demo.' });
    return;
  }

  try {
    const orderCode = Number(req.params.orderCode);
    if (isNaN(orderCode)) {
      res.status(400).json({ error: 'Mã đơn hàng không hợp lệ.' });
      return;
    }

    const order = await PaymentOrder.findOne({ orderCode, userId: req.userId });
    if (!order) {
      res.status(404).json({ error: 'Không tìm thấy đơn nạp tiền.' });
      return;
    }

    const result = await completePaymentOrderAtomic(orderCode, {
      simulated: true,
      simulatedAt: new Date(),
    });

    res.json({
      success: true,
      message: `Giả lập nạp thành công! Đã cộng +${order.xuAmount} Xu vào ví của mẹ.`,
      order: result.order,
      newBalance: result.user?.xuBalance,
    });
  } catch (error) {
    console.error('Simulate PayOS success error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi giả lập nạp tiền.' });
  }
});

// ========================================================
// LANDING PAGE / GUEST WALLET APIS (Full-Stack Support)
// ========================================================

/**
 * GET /api/wallet/landing/:clientId
 * Lấy số dư khả dụng, số dư ký quỹ Escrow và lịch sử ví trên Landing Page
 */
router.get('/landing/:clientId', (req: Request, res: Response): void => {
  try {
    const rawId = req.params.clientId;
    const clientId = (Array.isArray(rawId) ? rawId[0] : rawId) || 'guest_default';
    const wallet = getOrCreateWallet(clientId);
    res.json({
      success: true,
      clientId: wallet.clientId,
      availableXu: wallet.availableXu,
      escrowXu: wallet.escrowXu,
      totalXu: wallet.totalXu,
      transactions: wallet.transactions,
    });
  } catch (error) {
    console.error('Get landing wallet error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin ví Landing Page.' });
  }
});

/**
 * POST /api/wallet/landing/topup/create
 * Tạo đơn nạp PayOS VietQR trực tiếp từ Landing Page
 */
router.post('/landing/topup/create', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = PayOSTopupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { xuAmount } = parsed.data;
    const clientId = req.body.clientId || 'guest_default';
    // 1 Xu = 1.000 VNĐ
    const vndAmount = xuAmount * 1000;
    const orderCode = Number(String(Date.now()).slice(-9));
    const description = `KINDR NAP ${xuAmount} XU`.slice(0, 25);

    const paymentLink = await payosService.createPaymentLink({
      orderCode,
      amount: vndAmount,
      description,
      buyerName: 'Mẹ Bỉm Landing Page',
    });

    const paymentOrder = await PaymentOrder.create({
      orderCode,
      clientId,
      userName: 'Mẹ Bỉm Landing Page',
      type: 'TOPUP',
      xuAmount,
      vndAmount,
      status: 'PENDING',
      paymentLinkId: paymentLink.paymentLinkId,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      accountNumber: paymentLink.accountNumber,
      accountName: paymentLink.accountName,
      bin: paymentLink.bin,
      description: paymentLink.description,
    });

    // Save into landing wallet json store
    recordWalletOrder(clientId, {
      orderCode,
      xuAmount,
      vndAmount,
      status: 'PENDING',
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      accountNumber: paymentLink.accountNumber,
      accountName: paymentLink.accountName,
      bin: paymentLink.bin,
      description: paymentLink.description,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Đã tạo link thanh toán VietQR thành công.',
      orderCode: paymentOrder.orderCode,
      xuAmount: paymentOrder.xuAmount,
      vndAmount: paymentOrder.vndAmount,
      checkoutUrl: paymentOrder.checkoutUrl,
      qrCode: paymentOrder.qrCode,
      accountNumber: paymentOrder.accountNumber,
      accountName: paymentOrder.accountName,
      bin: paymentOrder.bin,
      description: paymentOrder.description,
      status: paymentOrder.status,
    });
  } catch (error: any) {
    console.error('Landing topup create error:', error);
    res.status(500).json({ error: error?.message || 'Lỗi hệ thống khi tạo đơn nạp PayOS.' });
  }
});

/**
 * GET /api/wallet/landing/topup/status/:orderCode
 * Polling kiểm tra trạng thái đơn nạp cho Landing Page
 */
router.get('/landing/topup/status/:orderCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderCode = Number(req.params.orderCode);
    if (isNaN(orderCode)) {
      res.status(400).json({ error: 'Mã đơn hàng không hợp lệ.' });
      return;
    }

    let order = await PaymentOrder.findOne({ orderCode });

    // Nếu PENDING, thử đồng bộ với PayOS
    if (order && order.status === 'PENDING') {
      try {
        const payosInfo = await payosService.getPaymentLinkInformation(orderCode);
        if (payosInfo && payosInfo.status === 'PAID') {
          const comp = await completePaymentOrderAtomic(orderCode, payosInfo);
          order = comp.order || order;
        }
      } catch (syncErr) {
        console.warn('PayOS landing sync warning:', syncErr);
      }
    }

    // Check landing json store fallback if not in Mongo
    const landingResult = completeLandingTopup(orderCode);
    const isPaid = (order && order.status === 'PAID') || (landingResult.wallet && landingResult.alreadyPaid);

    const clientId = order?.clientId || landingResult.wallet?.clientId || 'guest_default';
    const wallet = getOrCreateWallet(clientId);

    res.json({
      success: true,
      orderCode,
      status: isPaid ? 'PAID' : (order?.status || 'PENDING'),
      wallet: {
        availableXu: wallet.availableXu,
        escrowXu: wallet.escrowXu,
        totalXu: wallet.totalXu,
      },
    });
  } catch (error) {
    console.error('Landing status check error:', error);
    res.status(500).json({ error: 'Lỗi kiểm tra trạng thái đơn.' });
  }
});

/**
 * POST /api/wallet/landing/topup/simulate-paid/:orderCode
 * Giả lập thanh toán thành công cho Landing Page (sân khấu demo)
 */
router.post('/landing/topup/simulate-paid/:orderCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderCode = Number(req.params.orderCode);
    if (isNaN(orderCode)) {
      res.status(400).json({ error: 'Mã đơn hàng không hợp lệ.' });
      return;
    }

    // 1. Complete Mongo atomic if exists
    const comp = await completePaymentOrderAtomic(orderCode, {
      simulated: true,
      simulatedAt: new Date(),
    });

    // 2. Complete landing wallet store
    const landingComp = completeLandingTopup(orderCode, new Date());
    const order = comp.order || await PaymentOrder.findOne({ orderCode });
    const clientId = order?.clientId || landingComp.wallet?.clientId || 'guest_default';
    const wallet = getOrCreateWallet(clientId);

    res.json({
      success: true,
      message: 'Giả lập thanh toán thành công!',
      status: 'PAID',
      xuAmount: order?.xuAmount || landingComp.xuAmount || 50,
      wallet: {
        availableXu: wallet.availableXu,
        escrowXu: wallet.escrowXu,
        totalXu: wallet.totalXu,
      },
    });
  } catch (error) {
    console.error('Landing simulate paid error:', error);
    res.status(500).json({ error: 'Lỗi khi giả lập thanh toán.' });
  }
});

/**
 * POST /api/wallet/landing/escrow-lock
 * Tạm khóa 50 Xu khi đổi đồ trên Simulator
 */
router.post('/landing/escrow-lock', (req: Request, res: Response): void => {
  try {
    const clientId = req.body.clientId || 'guest_default';
    const amount = Number(req.body.amount) || 50;
    const wallet = updateEscrowLock(clientId, amount);
    res.json({
      success: true,
      wallet: {
        availableXu: wallet.availableXu,
        escrowXu: wallet.escrowXu,
        totalXu: wallet.totalXu,
      },
    });
  } catch (error) {
    console.error('Landing escrow lock error:', error);
    res.status(500).json({ error: 'Lỗi khi cập nhật Escrow.' });
  }
});

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

    if (!ENV.BANK_ACCOUNT_NUMBER || !ENV.BANK_ACCOUNT_NUMBER.trim()) {
      res.status(503).json({ error: 'Chưa cấu hình tài khoản nhận tiền của sàn.' });
      return;
    }

    const vndAmount = xuAmount * 1000;
    const numericOrderCode = Number(String(Date.now()).slice(-9));
    const orderCode = `TOPUP_${numericOrderCode}`;
    const description = `KINDR NAP ${xuAmount} XU`.slice(0, 25);

    // Call PayOS
    const paymentLink = await payosService.createPaymentLink({
      orderCode: numericOrderCode,
      amount: vndAmount,
      description,
      buyerName: user.name,
      buyerPhone: user.phone,
      buyerEmail: user.email,
    });

    // Record in PaymentOrder for PayOS tracking
    await PaymentOrder.create({
      orderCode: numericOrderCode,
      userId: user._id,
      userName: user.name,
      userPhone: user.phone,
      type: 'TOPUP',
      xuAmount,
      vndAmount,
      status: 'PENDING',
      paymentLinkId: paymentLink.paymentLinkId,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      accountNumber: paymentLink.accountNumber,
      accountName: paymentLink.accountName,
      bin: paymentLink.bin,
      description: paymentLink.description,
    });

    const accountNum = paymentLink.accountNumber || ENV.BANK_ACCOUNT_NUMBER || '0822835695';
    const accountName = paymentLink.accountName || ENV.BANK_ACCOUNT_HOLDER || 'CONG DONG KINDR';
    const binCode = paymentLink.bin || '970422';

    // Tạo QR Code URL luôn hiển thị được trực tiếp trên thẻ <img>
    let qrImageUrl = '';
    if (paymentLink.qrCode && paymentLink.qrCode.startsWith('http')) {
      qrImageUrl = paymentLink.qrCode;
    } else if (paymentLink.qrCode && paymentLink.qrCode.startsWith('000201')) {
      // Dùng endpoint tạo QR image từ chuỗi EMVCo chuẩn ngân hàng
      qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(paymentLink.qrCode)}`;
    } else {
      qrImageUrl = `https://img.vietqr.io/image/${binCode}-${accountNum}-compact2.png?amount=${vndAmount}&addInfo=${encodeURIComponent(paymentLink.description || description)}&accountName=${encodeURIComponent(accountName)}`;
    }

    const order = await TopupOrder.create({
      orderCode,
      userId: user._id,
      userName: user.name,
      userPhone: user.phone,
      xuAmount,
      vndAmount,
      memo: paymentLink.description || description,
      vietqrUrl: qrImageUrl,
      bankName: paymentLink.accountName ? 'MBBank' : (ENV.BANK_NAME || 'MBBank'),
      accountNumber: accountNum,
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
        accountHolder: paymentLink.accountName || ENV.BANK_ACCOUNT_HOLDER || 'NGUYEN NGOC BUU',
        checkoutUrl: paymentLink.checkoutUrl,
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
    const rawParam = req.params.orderCode;
    const rawCode = (Array.isArray(rawParam) ? rawParam[0] : rawParam) || '';
    const order = await TopupOrder.findOne({ orderCode: rawCode, userId: req.userId });
    if (!order) {
      res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
      return;
    }

    if (order.status !== 'completed') {
      const numCode = Number(rawCode.replace(/\D/g, '').slice(-9));
      if (!isNaN(numCode)) {
        try {
          const payosInfo = await payosService.getPaymentLinkInformation(numCode);
          if (payosInfo && (payosInfo.status === 'PAID' || payosInfo.status === 'SUCCESS')) {
            await completePaymentOrderAtomic(numCode, payosInfo);
            order.status = 'completed';
            order.completedAt = new Date();
            await order.save();
          }
        } catch (err) {
          // Ignore transient network errors during rapid polling
        }

        if (order.status !== 'completed') {
          const pOrder = await PaymentOrder.findOne({ orderCode: numCode });
          if (pOrder && pOrder.status === 'PAID') {
            order.status = 'completed';
            order.completedAt = pOrder.paidAt || new Date();
            await order.save();
          }
        }
      }
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
 * POST /api/wallet/orders/:orderCode/simulate-webhook
 * Simulate an incoming SePay / Casso / VietQR bank transfer webhook for a pending TopupOrder (demo/dev mode).
 */
router.post('/orders/:orderCode/simulate-webhook', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!ENV.ENABLE_DEMO_TOPUP) {
    res.status(403).json({ error: 'Chức năng mô phỏng Webhook ngân hàng chỉ khả dụng ở môi trường Demo/Dev.' });
    return;
  }
  try {
    const order = await TopupOrder.findOne({ orderCode: req.params.orderCode, userId: req.userId });
    if (!order) {
      res.status(404).json({ error: 'Không tìm thấy đơn nạp VietQR.' });
      return;
    }

    if (order.status === 'completed') {
      res.status(200).json({
        success: true,
        message: 'Đơn nạp Xu này đã được hoàn tất trước đó.',
        order,
      });
      return;
    }

    const completedOrder = await TopupOrder.findOneAndUpdate(
      { _id: order._id, status: { $in: ['pending', 'expired'] } },
      {
        $set: {
          status: 'completed',
          transactionRef: `SEPAY_SIM_${Date.now()}`,
          gatewayName: 'sepay_simulated',
          completedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!completedOrder) {
      res.status(400).json({ error: 'Đơn nạp Xu đã được xử lý.' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      completedOrder.userId,
      { $inc: { xuBalance: completedOrder.xuAmount } },
      { new: true }
    );

    const notif = await Notification.create({
      userId: completedOrder.userId,
      type: 'xu_released',
      title: 'Nạp Xu VietQR Tự Động Thành Công!',
      body: `Ngân hàng vừa xác nhận chuyển khoản ${completedOrder.vndAmount.toLocaleString('vi-VN')}đ (${completedOrder.memo}). Đã cộng +${completedOrder.xuAmount} Xu vào ví của mẹ!`,
    });
    emitToUser(completedOrder.userId.toString(), 'notification_new', notif);

    emitToUser(completedOrder.userId.toString(), 'topup_success', {
      orderCode: completedOrder.orderCode,
      xuAmount: completedOrder.xuAmount,
      newBalance: updatedUser?.xuBalance,
    });

    res.json({
      success: true,
      message: `Webhook Ngân hàng xác nhận thành công! Đã cộng +${completedOrder.xuAmount} Xu vào ví.`,
      order: completedOrder,
      newBalance: updatedUser?.xuBalance,
    });
  } catch (error) {
    console.error('Simulate webhook error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi mô phỏng Webhook.' });
  }
});

/**
 * POST /api/wallet/topup
 * Immediate simulated topup (useful for test/demo mode)
 */
router.post('/topup', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!ENV.ENABLE_DEMO_TOPUP) {
    res.status(403).json({ error: 'Chức năng nạp Xu trực tiếp chỉ được phép trong chế độ demo (ENABLE_DEMO_TOPUP).' });
    return;
  }
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

    const vndAmount = xuAmount * 1000;
    const orderCode = `TOPUP_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const memo = `KINDR NAP ${xuAmount}XU ${orderCode}`;
    const bankCode = ENV.BANK_CODE || 'MB';
    const bankNum = ENV.BANK_ACCOUNT_NUMBER || '000000000';
    const vietqrUrl = `https://img.vietqr.io/image/${bankCode}-${bankNum}-compact.png?amount=${vndAmount}&addInfo=${encodeURIComponent(memo)}`;

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
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const xWebhookSecret = req.headers['x-webhook-secret'];

    let providedSecret = '';
    if (typeof xWebhookSecret === 'string') {
      providedSecret = xWebhookSecret.trim();
    } else if (typeof authHeader === 'string') {
      const match = authHeader.match(/^(?:Bearer|Apikey)\s+(.+)$/i);
      providedSecret = match ? match[1].trim() : authHeader.trim();
    }

    // Check against configured ENV.WEBHOOK_SECRET
    if (!providedSecret || providedSecret !== ENV.WEBHOOK_SECRET) {
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

    // 4. Verify amount: rawAmount MUST be > 0 and >= order.vndAmount
    if (!rawAmount || rawAmount <= 0) {
      res.status(400).json({ error: 'Số tiền chuyển khoản trong webhook không hợp lệ (phải > 0).' });
      return;
    }
    if (rawAmount < order.vndAmount) {
      res.status(400).json({
        error: `Số tiền chuyển khoản (${rawAmount}đ) không đủ so với giá trị đơn hàng (${order.vndAmount}đ).`,
      });
      return;
    }

    // 5. Atomic CAS: transition from 'pending' or 'expired' to 'completed'
    const completedOrder = await TopupOrder.findOneAndUpdate(
      { _id: order._id, status: { $in: ['pending', 'expired'] } },
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
      title: 'Nạp Xu Tự Động Thành Công!',
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
      title: 'Nạp Xu Tự Động Thành Công!',
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

    // Atomic compare-and-swap deduction
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: req.userId,
        isLocked: { $ne: true },
        $expr: {
          $gte: [
            { $subtract: ['$xuBalance', { $ifNull: ['$welcomeCreditRemaining', 0] }] },
            xuAmount,
          ],
        },
      },
      { $inc: { xuBalance: -xuAmount } },
      { new: true }
    );

    if (!updatedUser) {
      const currentUser = await User.findById(req.userId);
      if (!currentUser) {
        res.status(404).json({ error: 'Tài khoản không tồn tại.' });
        return;
      }
      if (currentUser.isLocked) {
        res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa, không thể rút tiền.' });
        return;
      }
      const withdrawableXu = Math.max(0, currentUser.xuBalance - (currentUser.welcomeCreditRemaining || 0));
      if (currentUser.welcomeCreditRemaining > 0 && currentUser.xuBalance >= xuAmount) {
        res.status(400).json({
          error: `Số dư có thể rút là ${withdrawableXu} Xu. ${currentUser.welcomeCreditRemaining} Xu quà tặng chào mừng chỉ dùng để đổi đồ trên sàn, không thể rút thành tiền mặt.`,
        });
        return;
      }
      res.status(400).json({
        error: `Số dư khả dụng (${withdrawableXu} Xu) không đủ để rút ${xuAmount} Xu.`,
      });
      return;
    }

    const vndAmount = xuAmount * 1000;
    const feeVnd = Math.round(vndAmount * 0.1); // 10% cash-out fee
    const payoutVnd = vndAmount - feeVnd;

    const withdrawRequest = await WithdrawRequest.create({
      userId: updatedUser._id,
      userName: updatedUser.name,
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
 * Get withdraw and topup history (including PayOS payment orders)
 */
router.get('/history', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [withdrawRequests, topupOrders, payosOrders] = await Promise.all([
      WithdrawRequest.find({ userId: req.userId }).sort({ createdAt: -1 }).lean(),
      TopupOrder.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(30).lean(),
      PaymentOrder.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(30).lean(),
    ]);

    res.json({ withdrawRequests, topupOrders, payosOrders });
  } catch (error) {
    console.error('Get wallet history error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy lịch sử ví.' });
  }
});

export default router;
