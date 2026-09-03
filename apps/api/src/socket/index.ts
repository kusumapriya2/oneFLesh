// ============================================================
// OneFlesh — Socket.IO Server (RS256 JWT Auth)
// ============================================================

import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { getJwtKeys } from '../config/jwt.js';
import { logger } from '../config/logger.js';
import type { JwtPayload } from '@oneflesh/shared';

export let io: Server | null = null;

export function initSocket(httpServer: HttpServer): void {
  io = new Server(httpServer, {
    cors: {
      origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ─── JWT Authentication ───────────────────────────────────
  io.use((socket, next) => {
    try {
      // Support both cookie and Authorization header
      const token =
        (socket.handshake.auth['token'] as string | undefined) ??
        (socket.handshake.headers['authorization']?.replace('Bearer ', '') as string | undefined) ??
        (socket.handshake.headers['cookie']
          ?.split('; ')
          .find((c) => c.startsWith('accessToken='))
          ?.split('=')[1] as string | undefined);

      if (!token) {
        return next(new Error('No authentication token'));
      }

      const { publicKey } = getJwtKeys();
      const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;

      // Attach user to socket data for downstream use
      socket.data['user'] = payload;
      return next();
    } catch (err) {
      logger.warn('Socket auth failed:', err instanceof Error ? err.message : String(err));
      return next(new Error('Authentication failed'));
    }
  });

  // ─── Connection handler ───────────────────────────────────
  io.on('connection', (socket) => {
    const user = socket.data['user'] as JwtPayload;
    const room = `user:${user.sub}`;

    // Join personal room for targeted notifications
    void socket.join(room);
    logger.debug(`Socket connected: user=${user.sub} role=${user.role}`);

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected: user=${user.sub} reason=${reason}`);
    });

    socket.on('error', (err) => {
      logger.error('Socket error:', err);
    });
  });

  logger.info('✅ Socket.IO initialised');
}

/**
 * Emit an event to a specific user (all their connected sockets).
 * Safe to call even when io has not been initialised (no-ops).
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) {
    logger.warn(`emitToUser called before socket init: event=${event} userId=${userId}`);
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
}
