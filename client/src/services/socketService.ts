// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/apiConfig';
import { getAccessToken } from './api';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;

  public async connect(): Promise<Socket | null> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return null;
    }

    try {
      this.isConnecting = true;
      const token = await getAccessToken();
      if (!token) {
        this.isConnecting = false;
        return null;
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Socket connected successfully');
      });

      this.socket.on('connect_error', (error) => {
        console.warn('⚠️ Socket connection error:', error.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      this.isConnecting = false;
      return this.socket;
    } catch (err) {
      console.error('Socket initialization failed:', err);
      this.isConnecting = false;
      return null;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  public emit(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket not connected, cannot emit: ${event}`);
    }
  }
}

export const socketService = new SocketService();
