// server/src/routes/ratings.ts
// ========================================
// RATINGS & CIVILIZATION REPUTATION ROUTES
// ========================================
import { Router, Response } from 'express';
import { z } from 'zod';
import { Rating } from '../models/Rating';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { emitToUser } from '../socket';

const router = Router();

// ---- Validation Schemas ----

const RatingSchema = z.object({
  transactionId: z.string().min(1, 'Thiếu transactionId'),
  stars: z.number().min(1).max(5, 'Đánh giá từ 1 đến 5 sao'),
  comment: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
});

// ---- Routes ----

/**
 * POST /api/ratings
 * Submit rating for a completed transaction and reward civilization points
 */
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = RatingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { transactionId, stars, comment, tags } = parsed.data;

    // 1. Verify transaction
    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      res.status(404).json({ error: 'Giao dịch không tồn tại.' });
      return;
    }

    if (tx.status !== 'completed') {
      res.status(400).json({ error: 'Chỉ có thể đánh giá các giao dịch đã hoàn tất thành công.' });
      return;
    }

    const isBuyer = tx.buyerId.toString() === req.userId;
    const isSeller = tx.sellerId.toString() === req.userId;

    if (!isBuyer && !isSeller) {
      res.status(403).json({ error: 'Bạn không tham gia vào giao dịch này.' });
      return;
    }

    // Check if already rated
    if (isBuyer && tx.buyerRated) {
      res.status(400).json({ error: 'Bạn đã đánh giá giao dịch này rồi.' });
      return;
    }
    if (isSeller && tx.sellerRated) {
      res.status(400).json({ error: 'Bạn đã đánh giá giao dịch này rồi.' });
      return;
    }

    // Determine partner
    const fromUserId = req.userId!;
    const fromUserName = isBuyer ? tx.buyerName : tx.sellerName;
    const toUserId = isBuyer ? tx.sellerId : tx.buyerId;
    const toUserName = isBuyer ? tx.sellerName : tx.buyerName;

    // 2. Create Rating Record
    const rating = await Rating.create({
      transactionId: tx._id,
      fromUserId,
      fromUserName,
      toUserId,
      toUserName,
      stars,
      comment,
      tags,
    });

    // 3. Mark transaction rated
    if (isBuyer) {
      tx.buyerRated = true;
    } else {
      tx.sellerRated = true;
    }
    await tx.save();

    // 4. Calculate Civilization Points and Reputation Score for Partner
    let pointsChanged = 0;
    if (stars === 5) pointsChanged = 5;
    else if (stars === 4) pointsChanged = 2;
    else if (stars === 3) pointsChanged = 0;
    else pointsChanged = -5; // 1-2 stars

    const partnerUser = await User.findById(toUserId);
    if (partnerUser) {
      // Update civilization points
      partnerUser.civilizationPoints = Math.min(
        100,
        Math.max(0, partnerUser.civilizationPoints + pointsChanged)
      );

      partnerUser.historyPoints.unshift({
        pointsChanged,
        reason: `Được ${fromUserName} đánh giá ${stars} sao: "${comment || 'Giao dịch tốt'}"`,
        date: new Date(),
      });

      // Update reputation rating average
      const oldCount = partnerUser.ratingCount || 0;
      const oldScore = partnerUser.reputationScore || 5.0;
      const newCount = oldCount + 1;
      const newScore = Number(((oldScore * oldCount + stars) / newCount).toFixed(1));

      partnerUser.ratingCount = newCount;
      partnerUser.reputationScore = newScore;
      partnerUser.tradesCount = (partnerUser.tradesCount || 0) + 1;

      await partnerUser.save();

      // 5. Send Notification to Partner
      const notif = await Notification.create({
        userId: partnerUser._id,
        type: 'rating_received',
        title: `Bạn nhận được đánh giá ${stars} sao ⭐`,
        body: `${fromUserName} vừa gửi đánh giá cho bạn: "${comment || 'Rất hài lòng'}" (${pointsChanged >= 0 ? '+' : ''}${pointsChanged} Điểm Văn Minh).`,
        relatedTransactionId: tx._id,
      });

      emitToUser(partnerUser._id.toString(), 'notification_new', notif);
    }

    res.status(201).json({
      message: 'Đã gửi đánh giá thành công. Cảm ơn mẹ đã lan tỏa văn minh cộng đồng Kindr!',
      rating,
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi gửi đánh giá.' });
  }
});

/**
 * GET /api/ratings/user/:userId
 * Get public ratings for a user
 */
router.get('/user/:userId', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ratings = await Rating.find({ toUserId: req.params.userId })
      .sort({ createdAt: -1 })
      .lean();

    const totalCount = ratings.length;
    const averageStars =
      totalCount > 0
        ? Number((ratings.reduce((acc, r) => acc + r.stars, 0) / totalCount).toFixed(1))
        : 5.0;

    res.json({
      ratings,
      totalCount,
      averageStars,
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách đánh giá.' });
  }
});

export default router;
