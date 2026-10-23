// d:\Kindr\web\src\services\socketService.ts
import { io, Socket } from 'socket.io-client';
import { getAccessToken, SOCKET_BASE_URL } from './api';

type EventHandler = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private activeChatIds: Set<string> = new Set();

  connect(): Socket | null {
    const token = getAccessToken();
    if (!token) return null;

    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });

    this.socket.on('connect', () => {
      this.rebindListeners();
      // Automatically re-join any active chat rooms upon connect / reconnect
      this.activeChatIds.forEach((chatId) => {
        this.socket?.emit('join_chat', { chatId });
      });
    });

    this.rebindListeners();
    return this.socket;
  }

  private rebindListeners(): void {
    if (!this.socket) return;
    this.listeners.forEach((handlers, event) => {
      this.socket?.off(event);
      handlers.forEach((cb) => {
        this.socket?.on(event, cb);
      });
    });
  }

  disconnect(): void {
    this.activeChatIds.clear();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: EventHandler): void {
    if (!callback) {
      this.listeners.delete(event);
      this.socket?.off(event);
      return;
    }
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback);
  }

  emit(event: string, payload?: unknown): void {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.emit(event, payload);
  }

  joinChat(chatId: string): void {
    this.activeChatIds.add(chatId);
    this.emit('join_chat', { chatId });
  }

  leaveChat(chatId: string): void {
    this.activeChatIds.delete(chatId);
    this.emit('leave_chat', { chatId });
  }

  markRead(chatId: string): void {
    this.emit('mark_read', { chatId });
  }

  sendTyping(chatId: string): void {
    this.emit('typing', { chatId });
  }

  sendStopTyping(chatId: string): void {
    this.emit('stop_typing', { chatId });
  }
}

export const socketService = new SocketService();
