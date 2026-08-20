// server/src/routes/chat.ts
// ========================================
// CHAT & CONVERSATION HISTORY ROUTES
// ========================================
import { Router, Response } from 'express';
import { z } from 'zod';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validateObjectId } from '../middleware/validateObjectId';

const router = Router();

// ---- Validation Schemas ----

const CreateChatSchema = z.object({
  productId: z.string().min(1, 'Thiếu productId'),
  sellerId: z.string().min(1, 'Thiếu sellerId'),
});

// ---- Routes ----

/**
 * GET /api/chats
 * Get list of active chats for current user
 */
router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawChats = await Chat.find({
      $or: [{ buyerId: req.userId }, { sellerId: req.userId }],
    })
      .sort({ lastMessageTime: -1 })
      .lean();

    const chats = rawChats.map((c) => {
      const isBuyer = c.buyerId.toString() === req.userId;
      return {
        ...c,
        unreadCount: isBuyer ? c.buyerUnreadCount : c.sellerUnreadCount,
      };
    });

    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy danh sách chat.' });
  }
});

/**
 * GET /api/chats/:id/messages
 * Get paginated messages for a chat
 */
router.get('/:id/messages', validateObjectId('id'), requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện.' });
      return;
    }

    const isParticipant =
      chat.buyerId.toString() === req.userId ||
      chat.sellerId.toString() === req.userId ||
      req.userRole === 'admin';

    if (!isParticipant) {
      res.status(403).json({ error: 'Bạn không thuộc cuộc trò chuyện này.' });
      return;
    }

    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ chatId: chat._id })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ chatId: chat._id }),
    ]);

    // Reset unread count for current user
    if (chat.buyerId.toString() === req.userId && chat.buyerUnreadCount > 0) {
      chat.buyerUnreadCount = 0;
      await chat.save();
    } else if (chat.sellerId.toString() === req.userId && chat.sellerUnreadCount > 0) {
      chat.sellerUnreadCount = 0;
      await chat.save();
    }

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy tin nhắn.' });
  }
});

/**
 * POST /api/chats
 * Create or retrieve existing chat room
 */
router.post('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = CreateChatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { productId, sellerId } = parsed.data;
    const buyerId = req.userId!;

    if (buyerId === sellerId) {
      res.status(400).json({ error: 'Bạn không thể tự mở chat với chính mình.' });
      return;
    }

    // Check if chat room already exists
    let chat = await Chat.findOne({
      productId,
      buyerId,
      sellerId,
    });

    if (chat) {
      res.json({ chat, isNew: false });
      return;
    }

    // Fetch related entities
    const [product, buyer, seller] = await Promise.all([
      Product.findById(productId),
      User.findById(buyerId),
      User.findById(sellerId),
    ]);

    if (!product || !buyer || !seller) {
      res.status(404).json({ error: 'Thông tin sản phẩm hoặc người dùng không tồn tại.' });
      return;
    }

    chat = await Chat.create({
      productId: product._id,
      productName: product.name,
      productImage: product.image,
      buyerId: buyer._id,
      buyerName: buyer.name,
      sellerId: seller._id,
      sellerName: seller.name,
      lastMessageText: 'Đã bắt đầu cuộc trò chuyện',
      lastMessageTime: new Date(),
      buyerUnreadCount: 0,
      sellerUnreadCount: 0,
    });

    res.status(201).json({ chat, isNew: true });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi tạo phòng chat.' });
  }
});

export default router;
