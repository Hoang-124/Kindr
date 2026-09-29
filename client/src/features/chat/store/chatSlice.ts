// src/features/chat/store/chatSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatSession, Message } from '../../../types/common';

export interface LatestUnreadSender {
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  chatId: string;
  timestamp: string;
}

interface ChatState {
  chats: ChatSession[];
  latestUnreadSender: LatestUnreadSender | null;
}

const initialState: ChatState = {
  chats: [],
  latestUnreadSender: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    createChatSession: (state, action: PayloadAction<ChatSession>) => {
      const exists = state.chats.find(c => c.id === action.payload.id);
      if (!exists) {
        state.chats.unshift(action.payload);
      }
    },
    upsertChatSession: (state, action: PayloadAction<ChatSession>) => {
      const idx = state.chats.findIndex(c => c.id === action.payload.id);
      if (idx >= 0) {
        const existingMessages = state.chats[idx].messages || [];
        const incomingMessages = action.payload.messages || [];
        state.chats[idx] = {
          ...state.chats[idx],
          ...action.payload,
          messages: incomingMessages.length >= existingMessages.length ? incomingMessages : existingMessages,
        };
      } else {
        state.chats.unshift(action.payload);
      }
    },
    setChatMessages: (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
      const { chatId, messages } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        const seenIds = new Set<string>();
        const uniqueList: Message[] = [];
        for (const m of messages) {
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id);
            uniqueList.push(m);
          }
        }
        chat.messages = uniqueList;
        if (uniqueList.length > 0) {
          const lastMsg = uniqueList[uniqueList.length - 1];
          chat.lastMessageText = lastMsg.content;
          chat.lastMessageTime = lastMsg.timestamp;
        }
      }
    },
    addMessage: (state, action: PayloadAction<{ chatId: string; message: Message; tempId?: string }>) => {
      const { chatId, message, tempId } = action.payload;
      const chat = state.chats.find(c => c.id === chatId || c.productId === chatId);
      if (!chat) return;

      if (!chat.messages) chat.messages = [];

      // 1. If exact duplicate ID already exists, update in-place
      const exactIdIndex = chat.messages.findIndex(m => m.id === message.id);
      if (exactIdIndex >= 0) {
        chat.messages[exactIdIndex] = { ...chat.messages[exactIdIndex], ...message };
        chat.lastMessageText = message.content;
        chat.lastMessageTime = message.timestamp;
        return;
      }

      // 2. Reconcile optimistic temp message: match by tempId or unconfirmed temp message
      const pendingTempIndex = chat.messages.findIndex(m =>
        (tempId && m.id === tempId) ||
        (m.id.startsWith('temp_') &&
         m.senderId === message.senderId &&
         m.content.trim() === message.content.trim())
      );

      if (pendingTempIndex >= 0) {
        chat.messages[pendingTempIndex] = message;
        chat.lastMessageText = message.content;
        chat.lastMessageTime = message.timestamp;
        return;
      }

      // 3. Near-duplicate check (same sender + same content within 5 seconds)
      const nearDuplicateIndex = chat.messages.findIndex(m =>
        m.senderId === message.senderId &&
        m.content.trim() === message.content.trim() &&
        Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000
      );

      if (nearDuplicateIndex >= 0) {
        chat.messages[nearDuplicateIndex] = message;
        chat.lastMessageText = message.content;
        chat.lastMessageTime = message.timestamp;
        return;
      }

      // 4. Truly new message
      chat.messages.push(message);
      chat.lastMessageText = message.content;
      chat.lastMessageTime = message.timestamp;
    },
    receiveIncomingMessage: (state, action: PayloadAction<{ chatId: string; message: Message; currentUserId?: string; tempId?: string }>) => {
      const { chatId, message, currentUserId, tempId } = action.payload;
      const isFromMe = Boolean(currentUserId && message.senderId === currentUserId);
      
      const chat = state.chats.find(c => c.id === chatId || c.productId === chatId);
      if (chat) {
        if (!chat.messages) chat.messages = [];

        // Check if message already exists by ID
        const exactIdx = chat.messages.findIndex(m => m.id === message.id);
        if (exactIdx >= 0) {
          chat.messages[exactIdx] = { ...chat.messages[exactIdx], ...message };
        } else {
          // Check temp or duplicate
          const tempIdx = chat.messages.findIndex(m =>
            (tempId && m.id === tempId) ||
            (m.id.startsWith('temp_') && m.senderId === message.senderId && m.content.trim() === message.content.trim()) ||
            (m.senderId === message.senderId && m.content.trim() === message.content.trim() && Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000)
          );

          if (tempIdx >= 0) {
            chat.messages[tempIdx] = message;
          } else {
            chat.messages.push(message);
          }
        }

        chat.lastMessageText = message.content;
        chat.lastMessageTime = message.timestamp;
        if (!isFromMe) {
          chat.unreadCount = (chat.unreadCount || 0) + 1;
        }
      }

      if (!isFromMe) {
        state.latestUnreadSender = {
          senderId: message.senderId,
          senderName: message.senderName || 'Mẹ bỉm',
          senderAvatar: message.senderAvatar || '',
          content: message.content,
          chatId,
          timestamp: message.timestamp,
        };
      }
    },
    setLatestUnreadSender: (state, action: PayloadAction<LatestUnreadSender | null>) => {
      state.latestUnreadSender = action.payload;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find(c => c.id === action.payload);
      if (chat) {
        chat.unreadCount = 0;
      }
      const hasAnyUnread = state.chats.some(c => (c.unreadCount || 0) > 0);
      if (!hasAnyUnread) {
        state.latestUnreadSender = null;
      }
    },
    hydrateChats: (state, action: PayloadAction<ChatSession[]>) => {
      state.chats = action.payload;
      // If any chat has unread messages, grab the most recent one for latestUnreadSender
      const unreadChat = action.payload.find(c => (c.unreadCount || 0) > 0);
      if (unreadChat && !state.latestUnreadSender) {
        state.latestUnreadSender = {
          senderId: unreadChat.sellerId,
          senderName: unreadChat.sellerName,
          senderAvatar: unreadChat.sellerAvatar || '',
          content: unreadChat.lastMessageText,
          chatId: unreadChat.id,
          timestamp: unreadChat.lastMessageTime,
        };
      }
    },
  },
});

export const { 
  createChatSession, 
  upsertChatSession, 
  setChatMessages, 
  addMessage, 
  receiveIncomingMessage,
  setLatestUnreadSender,
  markAsRead, 
  hydrateChats 
} = chatSlice.actions;
export default chatSlice.reducer;
