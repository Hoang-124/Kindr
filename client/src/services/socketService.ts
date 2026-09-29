// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/apiConfig';
import { getAccessToken } from './api';

interface SocketListener {
  event: string;
  callback: (...args: any[]) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private connectPromise: Promise<Socket | null> | null = null;
  private listeners: SocketListener[] = [];

  public async connect(): Promise<Socket | null> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          console.warn('[Socket] No access token found, skipping connect');
          return null;
        }

        // Clean up any stale disconnected instance
        if (this.socket) {
          this.socket.removeAllListeners();
          this.socket.disconnect();
          this.socket = null;
        }

        const socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
          console.log('[Socket] Connected successfully:', socket.id);
        });

        socket.on('connect_error', (error) => {
          console.warn('[Socket] Connection error:', error.message);
        });

        socket.on('disconnect', (reason) => {
          console.log('[Socket] Disconnected:', reason);
        });

        // Re-attach all registered listeners
        for (const { event, callback } of this.listeners) {
          socket.on(event, callback);
        }

        this.socket = socket;

        // Wait until connected or timeout gracefully after 3s
        await new Promise<void>((resolve) => {
          if (socket.connected) {
            return resolve();
          }
          const onConnect = () => {
            socket.off('connect', onConnect);
            resolve();
          };
          socket.on('connect', onConnect);
          setTimeout(() => {
            socket.off('connect', onConnect);
            resolve();
          }, 3000);
        });

        return socket;
      } catch (err) {
        console.error('[Socket] Initialization failed:', err);
        return null;
      } finally {
        this.connectPromise = null;
      }
    })();

    return this.connectPromise;
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

  public isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    const exists = this.listeners.some(
      (l) => l.event === event && l.callback === callback
    );
    if (!exists) {
      this.listeners.push({ event, callback });
    }

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback?: (...args: any[]) => void): void {
    this.listeners = this.listeners.filter(
      (l) => !(l.event === event && (!callback || l.callback === callback))
    );

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
      console.warn(`[Socket] Not connected, cannot emit: ${event}`);
    }
  }
}

export const socketService = new SocketService();
