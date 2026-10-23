// server/src/socket/chatHandler.ts
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { Chat, IChat } from '../models/Chat';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { sendPushToUser } from '../services/pushNotificationService';

async function findChatSafe(chatId: string, userId: string): Promise<any> {
  if (mongoose.Types.ObjectId.isValid(chatId)) {
    const chat = await Chat.findById(chatId);
    if (chat) return chat;
  }

  if (chatId.startsWith('chat_')) {
    const parts = chatId.split('_');
    if (parts.length >= 4) {
      const u1 = parts[1];
      const u2 = parts[2];
      const prodId = parts.slice(3).join('_');
      const chat = await Chat.findOne({
        productId: prodId,
        $or: [
          { buyerId: u1, sellerId: u2 },
          { buyerId: u2, sellerId: u1 },
        ],
      });
      if (chat) return chat;
    }
  }

  return Chat.findOne({
    $or: [{ buyerId: userId }, { sellerId: userId }],
    productId: chatId,
  });
}

export function setupChatHandler(io: Server, socket: Socket, userId: string): void {
  /**
   * Client emits: 'join_chat' { chatId: string }
   * Server: joins socket to chat room
   */
  socket.on('join_chat', async (payload: { chatId?: string } | string) => {
    try {
      const chatId = typeof payload === 'string' ? payload : payload?.chatId;
      if (!chatId) return;
      const chat = await findChatSafe(chatId, userId);
      if (!chat) return;

      // Only buyer or seller can join
      const isBuyer = chat.buyerId.toString() === userId;
      const isSeller = chat.sellerId.toString() === userId;
      if (!isBuyer && !isSeller) return;

      socket.join(`chat:${chat._id.toString()}`);
      if (chatId !== chat._id.toString()) {
        socket.join(`chat:${chatId}`);
      }

      // Mark messages as read
      if (isBuyer) {
        chat.buyerUnreadCount = 0;
      } else {
        chat.sellerUnreadCount = 0;
      }
      await chat.save();

      console.log(`💬 User ${userId} joined chat ${chat._id.toString()}`);
    } catch (error) {
      console.error('join_chat error:', error);
    }
  });

  /**
   * Client emits: 'send_message' { chatId, content, tempId }
   * Server: saves to DB, broadcasts to chat room, updates lastMessage
   */
  socket.on('send_message', async ({ chatId, content, tempId }: { chatId: string; content: string; tempId?: string }) => {
    try {
      if (!content?.trim()) return;

      const chat = await findChatSafe(chatId, userId);
      if (!chat) return;

      const isBuyer = chat.buyerId.toString() === userId;
      const isSeller = chat.sellerId.toString() === userId;
      if (!isBuyer && !isSeller) return;

      const senderName = isBuyer ? chat.buyerName : chat.sellerName;

      // Retrieve sender profile to include their real avatar
      const senderUser = await User.findById(userId).select('avatar').lean();
      const senderAvatar = senderUser?.avatar || (isBuyer ? chat.buyerAvatar : chat.sellerAvatar) || '';

      // Save message to DB
      const message = await Message.create({
        chatId: chat._id,
        senderId: userId,
        senderName,
        senderAvatar,
        content: content.trim(),
      });

      // Update chat metadata
      chat.lastMessageText = content.trim();
      chat.lastMessageTime = new Date();
      if (isBuyer) {
        chat.sellerUnreadCount += 1;
      } else {
        chat.buyerUnreadCount += 1;
      }
      await chat.save();

      const messagePayload = {
        id: message._id.toString(),
        _id: message._id.toString(),
        chatId: chat._id.toString(),
        senderId: userId,
        senderName,
        senderAvatar,
        content: message.content,
        tempId,
        createdAt: message.createdAt.toISOString(),
        timestamp: message.createdAt.toISOString(),
      };

      const otherUserId = isBuyer ? chat.sellerId.toString() : chat.buyerId.toString();

      // Deduplicated broadcast to chat room and both users' personal rooms (supports 2+ phones per user & cross-device sync)
      io.to(`chat:${chat._id.toString()}`)
        .to(`user:${otherUserId}`)
        .to(`user:${userId}`)
        .emit('message_received', {
          chatId: chat._id.toString(),
          message: messagePayload,
          tempId,
        });

      io.to(`user:${otherUserId}`).emit('chat_updated', {
        chatId: chat._id.toString(),
        lastMessageText: content.trim(),
        lastMessageTime: new Date(),
        unreadCount: isBuyer ? chat.sellerUnreadCount : chat.buyerUnreadCount,
      });

      io.to(`user:${userId}`).emit('chat_updated', {
        chatId: chat._id.toString(),
        lastMessageText: content.trim(),
        lastMessageTime: new Date(),
        unreadCount: 0,
      });

      // Send background Push Notification
      sendPushToUser(otherUserId, {
        title: senderName,
        body: content.trim(),
        data: { type: 'chat_message', chatId },
      }).catch(() => {});
    } catch (error) {
      console.error('send_message error:', error);
    }
  });

  /**
   * Client emits: 'typing' { chatId }
   */
  socket.on('typing', ({ chatId }: { chatId: string }) => {
    socket.to(`chat:${chatId}`).emit('user_typing', { chatId, userId });
  });

  /**
   * Client emits: 'stop_typing' { chatId }
   */
  socket.on('stop_typing', ({ chatId }: { chatId: string }) => {
    socket.to(`chat:${chatId}`).emit('user_stop_typing', { chatId, userId });
  });

  socket.on('leave_chat', (payload: { chatId?: string } | string) => {
    const chatId = typeof payload === 'string' ? payload : payload?.chatId;
    if (chatId) socket.leave(`chat:${chatId}`);
  });
}
