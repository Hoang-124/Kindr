// server/src/routes/transactions.ts
// ========================================
// TRANSACTIONS & DOUBLE ESCROW ROUTES
// ========================================
import { Router, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validateObjectId } from '../middleware/validateObjectId';
import * as escrowService from '../services/escrowService';

const router = Router();

// ---- Validation Schemas ----

const CreateTransactionSchema = z.object({
  productId: z.string().min(1, 'Thiếu productId'),
});

const DisputeSchema = z.object({
  reason: z.string().min(2, 'Lý do khiếu nại phải từ 2 ký tự trở lên'),
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
    const rawTxs = await Transaction.find({
      $or: [{ buyerId: req.userId }, { sellerId: req.userId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const transactions = rawTxs.map((t: any) => ({
      ...t,
      id: t._id?.toString() || t.id,
      productId: t.productId?._id?.toString() || t.productId?.toString() || t.productId,
      buyerId: t.buyerId?._id?.toString() || t.buyerId?.toString() || t.buyerId,
      sellerId: t.sellerId?._id?.toString() || t.sellerId?.toString() || t.sellerId,
    }));

    res.json({ transactions });
  } catch (error) {
    console.error('Get my transactions error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách giao dịch.' });
  }
});

/**
 * GET /api/transactions/:id
 * Get single transaction details (unmasks contact info for participants)
 * Supports lookup by Transaction ID or Product ID
 */
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    if (!id) {
      res.status(400).json({ error: 'Thiếu mã giao dịch.' });
      return;
    }
    let transaction: any = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      transaction = await Transaction.findById(id).lean();
      if (!transaction) {
        // Also check if id is a productId for active user
        transaction = await Transaction.findOne({
          productId: id,
          $or: [{ buyerId: req.userId }, { sellerId: req.userId }],
        }).sort({ createdAt: -1 }).lean();
      }
    } else {
      transaction = await Transaction.findOne({
        $or: [
          { _id: id as any },
          { productId: id as any },
          { handoverCode: id.toUpperCase() },
        ],
      }).lean().catch(() => null);
    }

    if (!transaction) {
      res.status(404).json({ error: 'Không tìm thấy giao dịch.' });
      return;
    }

    const isParticipant =
      transaction.buyerId?.toString() === req.userId ||
      transaction.sellerId?.toString() === req.userId ||
      req.userRole === 'admin';

    if (!isParticipant) {
      res.status(403).json({ error: 'Bạn không có quyền xem thông tin giao dịch này.' });
      return;
    }

    // Enrich contact details from User model if missing
    const buyer = await User.findById(transaction.buyerId).select('name phone avatar').lean();
    const seller = await User.findById(transaction.sellerId).select('name phone avatar').lean();

    const formattedTx = {
      ...transaction,
      id: transaction._id?.toString() || transaction.id,
      productId: transaction.productId?._id?.toString() || transaction.productId?.toString() || transaction.productId,
      buyerId: transaction.buyerId?._id?.toString() || transaction.buyerId?.toString() || transaction.buyerId,
      sellerId: transaction.sellerId?._id?.toString() || transaction.sellerId?.toString() || transaction.sellerId,
      buyerName: transaction.buyerName || buyer?.name || 'Thành viên Kindr',
      buyerPhone: transaction.buyerPhone || buyer?.phone || '',
      buyerZalo: transaction.buyerZalo || transaction.buyerPhone || buyer?.phone || '',
      sellerName: transaction.sellerName || seller?.name || 'Thành viên Kindr',
      sellerPhone: transaction.sellerPhone || seller?.phone || '',
      sellerZalo: transaction.sellerZalo || transaction.sellerPhone || seller?.phone || '',
    };

    res.json({ transaction: formattedTx });
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
    const { handoverCode } = req.body || {};
    const result = await escrowService.confirmHandover(id, req.userId!, handoverCode);
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
