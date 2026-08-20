// server/src/routes/notifications.ts
// ========================================
// NOTIFICATIONS MANAGEMENT ROUTES
// ========================================
import { Router, Response } from 'express';
import { Notification } from '../models/Notification';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/notifications
 * Get paginated notifications for current user
 */
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: req.userId }),
    ]);

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy thông báo.' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Notification.countDocuments({
      userId: req.userId,
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
router.put('/:id/read', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Không tìm thấy thông báo.' });
      return;
    }

    res.json({ message: 'Đã đánh dấu đã đọc.', notification });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all user notifications as read
 */
router.put('/read-all', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true }
    );

    res.json({
      message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
});

export default router;
