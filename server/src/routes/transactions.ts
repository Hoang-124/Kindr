// server/src/routes/transactions.ts
// ========================================
// TRANSACTIONS & DOUBLE ESCROW ROUTES
// ========================================
import { Router, Response } from 'express';
import { z } from 'zod';
import { Transaction } from '../models/Transaction';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validateObjectId } from '../middleware/validateObjectId';
import * as escrowService from '../services/escrowService';

const router = Router();

// ---- Validation Schemas ----

const CreateTransactionSchema = z.object({
  productId: z.string().min(1, 'Thiếu productId'),
});

const DisputeSchema = z.object({
  reason: z.string().min(5, 'Lý do khiếu nại phải từ 5 ký tự trở lên'),
  evidenceImages: z.array(z.string()).optional(),
});

// ---- Routes ----

/**
 * POST /api/transactions
 * Create a new escrow transaction (freezes buyer's Xu, sets status to awaiting_handover)
 */
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = CreateTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const result = await escrowService.createEscrow(req.userId!, parsed.data.productId);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({
      message: 'Tạo giao dịch thành công! Xu đã được tạm khóa bảo chứng.',
      transaction: result.transaction,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi tạo giao dịch.' });
  }
});

/**
 * GET /api/transactions/my
 * Get list of transactions where current user is buyer or seller
 */
router.get('/my', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transactions = await Transaction.find({
      $or: [{ buyerId: req.userId }, { sellerId: req.userId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ transactions });
  } catch (error) {
    console.error('Get my transactions error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách giao dịch.' });
  }
});

/**
 * GET /api/transactions/:id
 * Get single transaction details (unmasks contact info for participants)
 */
router.get('/:id', validateObjectId('id'), requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id).lean();
    if (!transaction) {
      res.status(404).json({ error: 'Không tìm thấy giao dịch.' });
      return;
    }

    const isParticipant =
      transaction.buyerId.toString() === req.userId ||
      transaction.sellerId.toString() === req.userId ||
      req.userRole === 'admin';

    if (!isParticipant) {
      res.status(403).json({ error: 'Bạn không có quyền xem thông tin giao dịch này.' });
      return;
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction detail error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * POST /api/transactions/:id/handover
 * Confirm physical handover -> Starts 6-Hour Safeful Time
 */
router.post('/:id/handover', validateObjectId('id'), requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await escrowService.confirmHandover(id, req.userId!);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Đã xác nhận bàn giao! Khung 6 Giờ Kiểm Định tại nhà đã kích hoạt.',
    });
  } catch (error) {
    console.error('Handover error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi xác nhận bàn giao.' });
  }
});

/**
 * POST /api/transactions/:id/complete
 * Buyer manually finalizes transaction -> Releases all Xu to seller
 */
router.post('/:id/complete', validateObjectId('id'), requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const tx = await Transaction.findById(id);
    if (!tx) {
      res.status(404).json({ error: 'Giao dịch không tồn tại.' });
      return;
    }

    if (tx.buyerId.toString() !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ error: 'Chỉ người mua mới có quyền xác nhận hoàn tất giao dịch.' });
      return;
    }

    const result = await escrowService.finalizeTransaction(id);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Giao dịch hoàn tất thành công! Xu đã được giải phóng cho người bán.',
    });
  } catch (error) {
    console.error('Complete transaction error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi hoàn tất giao dịch.' });
  }
});

/**
 * POST /api/transactions/:id/dispute
 * Buyer files a dispute during 6-Hour Safeful Time
 */
router.post('/:id/dispute', validateObjectId('id'), requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = DisputeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const id = req.params.id as string;
    const result = await escrowService.fileDispute(
      id,
      req.userId!,
      parsed.data.reason,
      parsed.data.evidenceImages || []
    );

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: 'Đã gửi khiếu nại thành công. Hệ thống Kindr đã tạm khóa đơn hàng và sẽ liên hệ hỗ trợ.',
    });
  } catch (error) {
    console.error('Dispute transaction error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi khiếu nại giao dịch.' });
  }
});

export default router;
