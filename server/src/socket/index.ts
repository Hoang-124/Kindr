// server/src/socket/index.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { setupChatHandler } from './chatHandler';
import { setupNotificationHandler } from './notificationHandler';

let io: Server;

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function setupSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // JWT Authentication middleware for Socket.IO
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token as string, ENV.JWT_SECRET) as {
        userId: string;
        role: string;
      };
      (socket as any).userId = decoded.userId;
      (socket as any).userRole = decoded.role;
      next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    console.log(`🔌 Socket connected: ${userId} (${socket.id})`);

    // Auto-join personal notification room
    socket.join(`user:${userId}`);

    // Setup handlers
    setupChatHandler(io, socket, userId);
    setupNotificationHandler(io, socket, userId);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${userId}`);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
}

/**
 * Emit a notification to a specific user.
 * Call this from any route/service to push real-time notifications.
 */
export function emitToUser(userId: string, event: string, data: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}
