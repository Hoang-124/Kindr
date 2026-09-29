// server/src/routes/chat.ts
// ========================================
// CHAT & CONVERSATION HISTORY ROUTES
// ========================================
import { Router, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validateObjectId } from '../middleware/validateObjectId';

const router = Router();

// ---- Validation Schemas ----

const CreateChatSchema = z.object({
  productId: z.string().min(1, 'Thiếu productId'),
  sellerId: z.string().min(1, 'Thiếu sellerId'),
});

const SendMessageSchema = z.object({
  content: z.string().min(1, 'Nội dung tin nhắn không được để trống'),
  tempId: z.string().optional(),
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

    // Populate avatars for chat list
    const userIds = new Set<string>();
    rawChats.forEach((c) => {
      userIds.add(c.buyerId.toString());
      userIds.add(c.sellerId.toString());
    });
    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('avatar').lean();
    const avatarMap = new Map<string, string>();
    users.forEach((u) => avatarMap.set(u._id.toString(), u.avatar || ''));

    const chats = rawChats.map((c) => {
      const isBuyer = c.buyerId.toString() === req.userId;
      return {
        ...c,
        id: c._id.toString(),
        productId: c.productId?.toString(),
        buyerId: c.buyerId?.toString(),
        sellerId: c.sellerId?.toString(),
        buyerAvatar: c.buyerAvatar || avatarMap.get(c.buyerId.toString()) || '',
        sellerAvatar: c.sellerAvatar || avatarMap.get(c.sellerId.toString()) || '',
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
 * GET /api/chats/:id
 * Get single chat session details with latest metadata
 */
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id || '');
    let chat: any = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      chat = await Chat.findById(id).lean();
    }
    
    // Support lookup by composite key (e.g., chat_userId_partnerId_productId)
    if (!chat && id.startsWith('chat_')) {
      const parts = id.split('_');
      if (parts.length >= 4) {
        const u1 = parts[1];
        const u2 = parts[2];
        const prodId = parts.slice(3).join('_');
        
        chat = await Chat.findOne({
          productId: prodId,
          $or: [
            { buyerId: u1, sellerId: u2 },
            { buyerId: u2, sellerId: u1 },
          ],
        }).lean();

        // Auto-create chat session if it doesn't exist yet so reload/deep link never fails
        if (!chat && (u1 === req.userId || u2 === req.userId)) {
          const partnerId = u1 === req.userId ? u2 : u1;
          const [product, buyer, seller] = await Promise.all([
            Product.findById(prodId),
            User.findById(req.userId),
            User.findById(partnerId),
          ]);
          if (product && buyer && seller) {
            const isProductSeller = product.sellerId.toString() === req.userId;
            const newChat = await Chat.create({
              productId: product._id,
              productName: product.name,
              productImage: product.image,
              buyerId: isProductSeller ? seller._id : buyer._id,
              buyerName: isProductSeller ? seller.name : buyer.name,
              sellerId: isProductSeller ? buyer._id : seller._id,
              sellerName: isProductSeller ? buyer.name : seller.name,
              lastMessageText: 'Đã bắt đầu cuộc trò chuyện',
              lastMessageTime: new Date(),
              buyerUnreadCount: 0,
              sellerUnreadCount: 0,
            });
            chat = newChat.toObject();
          }
        }
      }
    }

    // Also support fallback lookup by productId associated with current user
    if (!chat) {
      const orConditions: any[] = [
        { 
          $and: [
            { $or: [{ buyerId: req.userId }, { sellerId: req.userId }] },
            { productId: id }
          ]
        }
      ];
      if (mongoose.Types.ObjectId.isValid(id)) {
        orConditions.unshift({ _id: new mongoose.Types.ObjectId(id) });
      }
      chat = await Chat.findOne({ $or: orConditions }).lean();
    }

    if (!chat) {
      res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện.' });
      return;
    }

    const isParticipant =
      chat.buyerId.toString() === req.userId ||
      chat.sellerId.toString() === req.userId ||
      req.userRole === 'admin';

    if (!isParticipant) {
      res.status(403).json({ error: 'Bạn không có quyền xem cuộc trò chuyện này.' });
      return;
    }

    // Ensure buyer and seller avatars are populated
    let buyerAvatar = chat.buyerAvatar || '';
    let sellerAvatar = chat.sellerAvatar || '';
    if (!buyerAvatar || !sellerAvatar) {
      const [buyerUser, sellerUser] = await Promise.all([
        User.findById(chat.buyerId).select('avatar').lean(),
        User.findById(chat.sellerId).select('avatar').lean(),
      ]);
      if (!buyerAvatar && buyerUser?.avatar) buyerAvatar = buyerUser.avatar;
      if (!sellerAvatar && sellerUser?.avatar) sellerAvatar = sellerUser.avatar;
    }

    const isBuyer = chat.buyerId.toString() === req.userId;
    const formattedChat = {
      ...chat,
      id: chat._id.toString(),
      productId: chat.productId?.toString(),
      buyerId: chat.buyerId?.toString(),
      sellerId: chat.sellerId?.toString(),
      buyerAvatar,
      sellerAvatar,
      unreadCount: isBuyer ? chat.buyerUnreadCount : chat.sellerUnreadCount,
    };

    res.json({ chat: formattedChat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi lấy thông tin chat.' });
  }
});

/**
 * POST /api/chats/:id/messages
 * Send message via HTTP API with automatic Socket broadcast & push notification
 */
router.post('/:id/messages', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = SendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id || '');
    let chat: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      chat = await Chat.findById(id);
    }
    if (!chat && id.startsWith('chat_')) {
      const parts = id.split('_');
      if (parts.length >= 4) {
        const u1 = parts[1];
        const u2 = parts[2];
        const prodId = parts.slice(3).join('_');
        chat = await Chat.findOne({
          productId: prodId,
          $or: [
            { buyerId: u1, sellerId: u2 },
            { buyerId: u2, sellerId: u1 },
          ],
        });
      }
    }
    if (!chat) {
      chat = await Chat.findOne({
        $or: [{ buyerId: req.userId }, { sellerId: req.userId }],
        productId: id,
      });
    }

    if (!chat) {
      res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện.' });
      return;
    }

    const isBuyer = chat.buyerId.toString() === req.userId;
    const isSeller = chat.sellerId.toString() === req.userId;
    if (!isBuyer && !isSeller && req.userRole !== 'admin') {
      res.status(403).json({ error: 'Bạn không thuộc cuộc trò chuyện này.' });
      return;
    }

    const senderName = isBuyer ? chat.buyerName : chat.sellerName;
    const content = parsed.data.content.trim();

    // Look up sender's avatar
    const senderUser = await User.findById(req.userId).select('name avatar').lean();
    const senderAvatar = senderUser?.avatar || (isBuyer ? chat.buyerAvatar : chat.sellerAvatar) || '';

    // 1. Create message
    const message = await Message.create({
      chatId: chat._id,
      senderId: req.userId,
      senderName,
      senderAvatar,
      content,
    });

    // 2. Update chat metadata
    chat.lastMessageText = content;
    chat.lastMessageTime = new Date();
    if (isBuyer) {
      chat.sellerUnreadCount += 1;
    } else {
      chat.buyerUnreadCount += 1;
    }
    await chat.save();

    // 3. Broadcast real-time event via Socket.IO
    try {
      const { getIO } = await import('../socket');
      const io = getIO();
      const messagePayload = {
        _id: message._id.toString(),
        id: message._id.toString(),
        chatId: chat._id.toString(),
        senderId: req.userId,
        senderName,
        senderAvatar,
        content: message.content,
        tempId: parsed.data.tempId,
        createdAt: message.createdAt.toISOString(),
        timestamp: message.createdAt.toISOString(),
      };

      io.to(`chat:${chat._id.toString()}`).emit('message_received', {
        chatId: chat._id.toString(),
        message: messagePayload,
      });

      const otherUserId = isBuyer ? chat.sellerId.toString() : chat.buyerId.toString();
      io.to(`user:${otherUserId}`).emit('chat_updated', {
        chatId: chat._id.toString(),
        lastMessageText: content,
        lastMessageTime: new Date(),
        unreadCount: isBuyer ? chat.sellerUnreadCount : chat.buyerUnreadCount,
      });

      // Deliver message payload to other user's personal channel in case they aren't inside the chat room
      io.to(`user:${otherUserId}`).emit('message_received', {
        chatId: chat._id.toString(),
        message: messagePayload,
      });
    } catch (e) {
      // Socket emission is best-effort
    }

    res.status(201).json({
      message: {
        id: message._id.toString(),
        senderId: req.userId,
        senderName,
        senderAvatar,
        content: message.content,
        tempId: parsed.data.tempId,
        timestamp: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi gửi tin nhắn.' });
  }
});

/**
 * GET /api/chats/:id/messages
 * Get paginated messages for a chat
 */
router.get('/:id/messages', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : String(req.params.id || '');
    let chat: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      chat = await Chat.findById(id);
    }
    if (!chat && id.startsWith('chat_')) {
      const parts = id.split('_');
      if (parts.length >= 4) {
        const u1 = parts[1];
        const u2 = parts[2];
        const prodId = parts.slice(3).join('_');
        chat = await Chat.findOne({
          productId: prodId,
          $or: [
            { buyerId: u1, sellerId: u2 },
            { buyerId: u2, sellerId: u1 },
          ],
        });
      }
    }
    if (!chat) {
      chat = await Chat.findOne({
        $or: [{ buyerId: req.userId }, { sellerId: req.userId }],
        productId: id,
      });
    }

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

    const [rawMessages, total] = await Promise.all([
      Message.find({ chatId: chat._id })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ chatId: chat._id }),
    ]);

    // Populate sender avatars for messages
    const [buyerUser, sellerUser] = await Promise.all([
      User.findById(chat.buyerId).select('avatar').lean(),
      User.findById(chat.sellerId).select('avatar').lean(),
    ]);
    const buyerAvatar = chat.buyerAvatar || buyerUser?.avatar || '';
    const sellerAvatar = chat.sellerAvatar || sellerUser?.avatar || '';

    // Normalize messages
    const messages = rawMessages.map((m) => {
      const isBuyerSender = m.senderId?.toString() === chat.buyerId.toString();
      return {
        id: m._id.toString(),
        senderId: m.senderId?.toString(),
        senderName: m.senderName,
        senderAvatar: m.senderAvatar || (isBuyerSender ? buyerAvatar : sellerAvatar),
        content: m.content,
        timestamp: m.createdAt?.toISOString(),
      };
    });

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

    const { productId, sellerId: targetPartnerId } = parsed.data;
    const currentUserId = req.userId!;

    if (currentUserId === targetPartnerId) {
      res.status(400).json({ error: 'Bạn không thể tự mở chat với chính mình.' });
      return;
    }

    // Check if chat room already exists between these 2 users for this product
    let chat = await Chat.findOne({
      productId,
      $or: [
        { buyerId: currentUserId, sellerId: targetPartnerId },
        { buyerId: targetPartnerId, sellerId: currentUserId },
      ],
    });

    if (chat) {
      const isBuyer = chat.buyerId.toString() === currentUserId;
      res.json({
        chat: {
          ...chat.toObject(),
          id: chat._id.toString(),
          productId: chat.productId?.toString(),
          buyerId: chat.buyerId?.toString(),
          sellerId: chat.sellerId?.toString(),
          unreadCount: isBuyer ? chat.buyerUnreadCount : chat.sellerUnreadCount,
        },
        isNew: false,
      });
      return;
    }

    // Fetch related entities
    const [product, currentUser, partnerUser] = await Promise.all([
      Product.findById(productId),
      User.findById(currentUserId),
      User.findById(targetPartnerId),
    ]);

    if (!product || !currentUser || !partnerUser) {
      res.status(404).json({ error: 'Thông tin sản phẩm hoặc người dùng không tồn tại.' });
      return;
    }

    // Determine actual roles: product owner is seller, the other is buyer
    const isOwnerCurrentUser = product.sellerId.toString() === currentUserId;
    const actualSeller = isOwnerCurrentUser ? currentUser : partnerUser;
    const actualBuyer = isOwnerCurrentUser ? partnerUser : currentUser;

    const newChat = await Chat.create({
      productId: product._id,
      productName: product.name,
      productImage: product.image,
      buyerId: actualBuyer._id,
      buyerName: actualBuyer.name,
      buyerAvatar: actualBuyer.avatar || '',
      sellerId: actualSeller._id,
      sellerName: actualSeller.name,
      sellerAvatar: actualSeller.avatar || '',
      lastMessageText: 'Đã bắt đầu cuộc trò chuyện',
      lastMessageTime: new Date(),
      buyerUnreadCount: 0,
      sellerUnreadCount: 0,
    });

    const isBuyer = newChat.buyerId.toString() === currentUserId;
    res.status(201).json({
      chat: {
        ...newChat.toObject(),
        id: newChat._id.toString(),
        productId: newChat.productId?.toString(),
        buyerId: newChat.buyerId?.toString(),
        buyerAvatar: newChat.buyerAvatar,
        sellerId: newChat.sellerId?.toString(),
        sellerAvatar: newChat.sellerAvatar,
        unreadCount: isBuyer ? newChat.buyerUnreadCount : newChat.sellerUnreadCount,
      },
      isNew: true,
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi tạo phòng chat.' });
  }
});

export default router;
