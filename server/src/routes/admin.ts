// server/src/routes/admin.ts
// ========================================
// ADMIN BACKOFFICE & MODERATION ROUTES
// ========================================
import { Router, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { WithdrawRequest } from '../models/WithdrawRequest';
import { Report } from '../models/Report';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import * as escrowService from '../services/escrowService';

const router = Router();

// Apply admin guard to all routes
router.use(requireAuth, requireAdmin);

// ---- Validation Schemas ----

const ResolveDisputeSchema = z.object({
  outcome: z.enum(['resolved_buyer', 'resolved_seller']),
});

const UpdateReportSchema = z.object({
  status: z.enum(['reviewed', 'dismissed']),
  adminNote: z.string().optional(),
});

// ---- Dashboard Stats ----

/**
 * GET /api/admin/dashboard
 */
router.get('/dashboard', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalTransactions,
      activeProducts,
      pendingDisputes,
      pendingWithdraws,
      openReports,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Transaction.countDocuments(),
      Product.countDocuments({ status: 'available' }),
      Transaction.countDocuments({ status: 'disputed' }),
      WithdrawRequest.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'open' }),
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalTransactions,
      activeProducts,
      pendingDisputes,
      pendingWithdraws,
      openReports,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi tải thống kê.' });
  }
});

// ---- Users Management ----

/**
 * GET /api/admin/users
 */
router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const filter: Record<string, any> = {};

    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * PUT /api/admin/users/:id/lock
 */
router.put('/users/:id/lock', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isLocked: true }, { new: true });
    if (!user) {
      res.status(404).json({ error: 'Người dùng không tồn tại.' });
      return;
    }
    res.json({ message: 'Đã khóa tài khoản thành công.', user });
  } catch (error) {
    console.error('Lock user error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * PUT /api/admin/users/:id/unlock
 */
router.put('/users/:id/unlock', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isLocked: false, disputeStrikeCount: 0 },
      { new: true }
    );
    if (!user) {
      res.status(404).json({ error: 'Người dùng không tồn tại.' });
      return;
    }
    res.json({ message: 'Đã mở khóa tài khoản thành công.', user });
  } catch (error) {
    console.error('Unlock user error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

// ---- Products Management ----

/**
 * GET /api/admin/products
 */
router.get('/products', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const filter: Record<string, any> = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * DELETE /api/admin/products/:id
 */
router.delete('/products/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Sản phẩm không tồn tại.' });
      return;
    }

    // Refund SafeFee to seller if removed by admin
    if (product.safeFeeLocked > 0) {
      await User.findByIdAndUpdate(product.sellerId, {
        $inc: {
          xuBalance: product.safeFeeLocked,
          xuFrozen: -product.safeFeeLocked,
        },
      });
    }

    product.status = 'removed';
    await product.save();

    res.json({ message: 'Đã gỡ sản phẩm vi phạm khỏi sàn.' });
  } catch (error) {
    console.error('Admin delete product error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

// ---- Transactions & Disputes Management ----

/**
 * GET /api/admin/transactions
 */
router.get('/transactions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const filter: Record<string, any> = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Admin get transactions error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * GET /api/admin/disputes
 */
router.get('/disputes', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const disputes = await Transaction.find({ status: 'disputed' })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ disputes });
  } catch (error) {
    console.error('Admin get disputes error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * PUT /api/admin/disputes/:id/resolve
 */
router.put('/disputes/:id/resolve', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = ResolveDisputeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const id = req.params.id as string;
    const result = await escrowService.resolveDispute(id, parsed.data.outcome);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: `Đã xử lý tranh chấp thành công: ${
        parsed.data.outcome === 'resolved_buyer'
          ? 'Hoàn trả Xu cho Người Mua'
          : 'Giải phóng Xu cho Người Bán'
      }.`,
    });
  } catch (error) {
    console.error('Admin resolve dispute error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

// ---- Withdraw Requests Management ----

/**
 * GET /api/admin/withdraws
 */
router.get('/withdraws', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status = 'pending' } = req.query;
    const filter: Record<string, any> = {};

    if (status !== 'all') {
      filter.status = status;
    }

    const withdrawRequests = await WithdrawRequest.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ withdrawRequests });
  } catch (error) {
    console.error('Admin get withdraws error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * PUT /api/admin/withdraws/:id/approve
 */
router.put('/withdraws/:id/approve', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const request = await WithdrawRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ error: 'Yêu cầu rút tiền không tồn tại.' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ error: 'Yêu cầu này đã được xử lý trước đó.' });
      return;
    }

    request.status = 'approved';
    await request.save();

    res.json({ message: 'Đã duyệt yêu cầu chuyển tiền thành công.', withdrawRequest: request });
  } catch (error) {
    console.error('Admin approve withdraw error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * PUT /api/admin/withdraws/:id/reject
 */
router.put('/withdraws/:id/reject', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const request = await WithdrawRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ error: 'Yêu cầu rút tiền không tồn tại.' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ error: 'Yêu cầu này đã được xử lý trước đó.' });
      return;
    }

    // Refund Xu to user balance
    await User.findByIdAndUpdate(request.userId, {
      $inc: { xuBalance: request.xuAmount },
    });

    request.status = 'rejected';
    request.adminNote = req.body.adminNote || 'Yêu cầu bị từ chối';
    await request.save();

    res.json({
      message: 'Đã từ chối yêu cầu rút tiền và hoàn trả lại Xu vào ví người dùng.',
      withdrawRequest: request,
    });
  } catch (error) {
    console.error('Admin reject withdraw error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

// ---- Reports Management ----

/**
 * GET /api/admin/reports
 */
router.get('/reports', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status = 'open', page = '1', limit = '20' } = req.query;
    const filter: Record<string, any> = {};

    if (status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Report.countDocuments(filter),
    ]);

    res.json({
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Admin get reports error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * PUT /api/admin/reports/:id
 */
router.put('/reports/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = UpdateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote,
      },
      { new: true }
    );

    if (!report) {
      res.status(404).json({ error: 'Báo cáo không tồn tại.' });
      return;
    }

    res.json({ message: 'Đã cập nhật trạng thái báo cáo.', report });
  } catch (error) {
    console.error('Admin update report error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

export default router;
