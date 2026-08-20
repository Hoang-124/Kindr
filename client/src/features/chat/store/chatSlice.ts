// src/features/chat/store/chatSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatSession, Message } from '../../../types/common';

interface ChatState {
  chats: ChatSession[];
}

const initialState: ChatState = {
  chats: [],
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
    addMessage: (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
      const { chatId, message } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        chat.messages.push(message);
        chat.lastMessageText = message.content;
        chat.lastMessageTime = message.timestamp;
        if (message.senderId !== 'user_hoalan') { // Assuming default active demo buyer is user_hoalan
          // In real app, increment if receiver is current user
        }
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find(c => c.id === action.payload);
      if (chat) {
        chat.unreadCount = 0;
      }
    },
    hydrateChats: (state, action: PayloadAction<ChatSession[]>) => {
      state.chats = action.payload;
    },
  },
});

export const { createChatSession, addMessage, markAsRead, hydrateChats } = chatSlice.actions;
export default chatSlice.reducer;
