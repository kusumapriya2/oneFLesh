// ============================================================
// OneFlesh — Redis Client (ioredis)
// ============================================================

import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

// Explicitly type parameters to avoid TS errors
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times: number): number {
    return Math.min(times * 50, 2000);
  },
  reconnectOnError(err: Error): boolean {
    // Example: reconnect on READONLY errors
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  },
});

// Event handlers with explicit types
redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err: Error) => logger.error('Redis error:', err));
redis.on('reconnecting', () => logger.warn('Redis reconnecting...'));

// ─── Key helpers ──────────────────────────────────────────────
export const RedisKeys = {
  refreshToken: (userId: string, sessionId: string) => `rt:${userId}:${sessionId}`,
  tokenBlacklist: (jti: string) => `blacklist:${jti}`,
  userSessions: (userId: string) => `sessions:${userId}`,
  mfaTempToken: (token: string) => `mfa:temp:${token}`,
  passwordReset: (token: string) => `pwd:reset:${token}`,
  loginAttempts: (email: string) => `login:attempts:${email}`,
  accountLock: (email: string) => `login:lock:${email}`,
  aiDailyRequests: (userId: string, date: string) => `ai:req:${userId}:${date}`,
  aiDailyTokens: (date: string) => `ai:tokens:${date}`,
  searchCache: (key: string) => `search:${key}`,
  aiResponseCache: (key: string) => `ai:cache:${key}`,
  notificationCount: (userId: string) => `notif:unread:${userId}`,
};

// ─── TTL constants (seconds) ──────────────────────────────────
export const RedisTTL = {
  REFRESH_TOKEN: 7 * 24 * 60 * 60,   // 7 days
  MFA_TEMP: 5 * 60,                  // 5 minutes
  PASSWORD_RESET: 15 * 60,           // 15 minutes
  TOKEN_BLACKLIST: 24 * 60 * 60,     // 24 hours
  SEARCH_CACHE: 5 * 60,              // 5 minutes
  AI_RESPONSE_CACHE: 60 * 60,        // 1 hour
};
