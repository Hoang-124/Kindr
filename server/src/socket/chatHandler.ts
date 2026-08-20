// server/src/socket/chatHandler.ts
import { Server, Socket } from 'socket.io';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';

export function setupChatHandler(io: Server, socket: Socket, userId: string): void {
  /**
   * Client emits: 'join_chat' { chatId: string }
   * Server: joins socket to chat room
   */
  socket.on('join_chat', async ({ chatId }: { chatId: string }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) return;

      // Only buyer or seller can join
      const isBuyer = chat.buyerId.toString() === userId;
      const isSeller = chat.sellerId.toString() === userId;
      if (!isBuyer && !isSeller) return;

      socket.join(`chat:${chatId}`);

      // Mark messages as read
      if (isBuyer) {
        chat.buyerUnreadCount = 0;
      } else {
        chat.sellerUnreadCount = 0;
      }
      await chat.save();

      console.log(`💬 User ${userId} joined chat ${chatId}`);
    } catch (error) {
      console.error('join_chat error:', error);
    }
  });

  /**
   * Client emits: 'send_message' { chatId, content }
   * Server: saves to DB, broadcasts to chat room, updates lastMessage
   */
  socket.on('send_message', async ({ chatId, content }: { chatId: string; content: string }) => {
    try {
      if (!content?.trim()) return;

      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const isBuyer = chat.buyerId.toString() === userId;
      const isSeller = chat.sellerId.toString() === userId;
      if (!isBuyer && !isSeller) return;

      const senderName = isBuyer ? chat.buyerName : chat.sellerName;

      // Save message to DB
      const message = await Message.create({
        chatId,
        senderId: userId,
        senderName,
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

      // Broadcast to everyone in chat room
      io.to(`chat:${chatId}`).emit('message_received', {
        chatId,
        message: {
          _id: message._id,
          senderId: userId,
          senderName,
          content: message.content,
          createdAt: message.createdAt,
        },
      });

      // Also notify the other user's personal room (for chat list update)
      const otherUserId = isBuyer ? chat.sellerId.toString() : chat.buyerId.toString();
      io.to(`user:${otherUserId}`).emit('chat_updated', {
        chatId,
        lastMessageText: content.trim(),
        lastMessageTime: new Date(),
        unreadCount: isBuyer ? chat.sellerUnreadCount : chat.buyerUnreadCount,
      });
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

  socket.on('leave_chat', ({ chatId }: { chatId: string }) => {
    socket.leave(`chat:${chatId}`);
  });
}
