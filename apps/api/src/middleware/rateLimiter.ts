// ============================================================
// OneFlesh — Rate Limiting Middleware
// ============================================================

import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis, RedisKeys } from '../config/redis.js';
import type { Request, Response } from 'express';

const rateLimitResponse = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  });
};

// ─── General API: 100 req/min per IP ──────────────────────────
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:general:',
  }),
});

// ─── Auth endpoints: 10 req/15min per IP (100 in dev) ────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env['NODE_ENV'] === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:auth:',
  }),
});

// ─── Password reset: 3 req/hour per IP ───────────────────────
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:reset:',
  }),
});

// ─── AI endpoints: 50 req/day per user ───────────────────────
export async function aiRateLimiter(
  req: Request,
  res: Response,
  next: Parameters<typeof next>[0],
): Promise<void> {
  if (!req.user) {
    next();
    return;
  }

  const today = new Date().toISOString().split('T')[0] as string;
  const key = RedisKeys.aiDailyRequests(req.user.sub, today);

  const current = await redis.incr(key);
  if (current === 1) {
    // Set expiry on first request of the day
    await redis.expire(key, 24 * 60 * 60);
  }

  if (current > 50) {
    res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMIT',
        message: 'AI request limit reached (50/day). Please try again tomorrow.',
      },
    });
    return;
  }

  next();
}

// ─── File upload: 10 req/min per user ─────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:upload:',
  }),
});
