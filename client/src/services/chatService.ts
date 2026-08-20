// src/services/chatService.ts
import { api } from './api';
import { ChatSession, Message } from '../types/common';

function normalizeChat(raw: any): ChatSession {
  return {
    id: raw.id || raw._id?.toString(),
    productId: raw.productId?._id?.toString() || raw.productId?.toString() || raw.productId,
    productName: raw.productName,
    productImage: raw.productImage || '',
    buyerId: raw.buyerId?._id?.toString() || raw.buyerId?.toString() || raw.buyerId,
    buyerName: raw.buyerName,
    sellerId: raw.sellerId?._id?.toString() || raw.sellerId?.toString() || raw.sellerId,
    sellerName: raw.sellerName,
    unreadCount: raw.unreadCount || 0,
    lastMessageText: raw.lastMessageText || '',
    lastMessageTime: raw.lastMessageTime || new Date().toISOString(),
    messages: (raw.messages || []).map((m: any) => ({
      id: m.id || m._id?.toString(),
      senderId: m.senderId?._id?.toString() || m.senderId?.toString() || m.senderId,
      content: m.content,
      timestamp: m.createdAt || m.timestamp || new Date().toISOString(),
    })),
  };
}

export async function getChats(): Promise<ChatSession[]> {
  const { data } = await api.get('/chats');
  return (data.chats || []).map(normalizeChat);
}

export async function getMessages(chatId: string, page = 1, limit = 50): Promise<{ messages: Message[]; pagination: any }> {
  const { data } = await api.get(`/chats/${chatId}/messages`, { params: { page, limit } });
  const messages: Message[] = (data.messages || []).map((m: any) => ({
    id: m.id || m._id?.toString(),
    senderId: m.senderId?._id?.toString() || m.senderId?.toString() || m.senderId,
    content: m.content,
    timestamp: m.createdAt || new Date().toISOString(),
  }));

  return {
    messages,
    pagination: data.pagination,
  };
}

export async function createChat(productId: string, sellerId: string): Promise<{ chat: ChatSession; isNew: boolean }> {
  const { data } = await api.post('/chats', { productId, sellerId });
  return {
    chat: normalizeChat(data.chat),
    isNew: data.isNew,
  };
}
