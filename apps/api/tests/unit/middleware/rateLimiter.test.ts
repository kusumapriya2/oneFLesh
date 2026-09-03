// ============================================================
// OneFlesh — Rate Limiter Tests
// Covers: H-08 (/refresh missing authLimiter),
//         aiRateLimiter correct behaviour
// ============================================================

jest.mock('../../src/config/redis.js', () => ({
  redis: {
    incr: jest.fn(),
    expire: jest.fn().mockResolvedValue(1),
    call: jest.fn(),
  },
  RedisKeys: {
    aiDailyRequests: (userId: string, date: string) => `ai:req:${userId}:${date}`,
  },
}));

jest.mock('express-rate-limit', () =>
  jest.fn((opts: unknown) => {
    // Return a tagged function so tests can identify limiter instances
    const fn = jest.fn((_req: unknown, _res: unknown, next: () => void) => next());
    (fn as unknown as Record<string, unknown>).__options = opts;
    return fn;
  }),
);

jest.mock('rate-limit-redis', () => ({
  RedisStore: jest.fn().mockImplementation(() => ({})),
}));

// ─── Imports ─────────────────────────────────────────────────

import type { Request, Response } from 'express';
import { redis, RedisKeys } from '../../src/config/redis.js';
import { aiRateLimiter } from '../../src/middleware/rateLimiter.js';

const mockRedisIncr = redis.incr as jest.MockedFunction<typeof redis.incr>;
const mockRedisExpire = redis.expire as jest.MockedFunction<typeof redis.expire>;

// ─── H-08: /refresh route lacks rate limiter ─────────────────
// This is verified by inspecting the Express router stack
// to confirm authLimiter is NOT present on POST /refresh

describe('H-08 · auth routes — /refresh rate limiting', () => {
  it('⚠️  FAILS BEFORE FIX — POST /refresh should be protected by authLimiter', async () => {
    // Dynamically import the auth router to inspect its middleware stack
    const { authRouter } = await import('../../src/modules/auth/auth.routes.js');
    const { authLimiter } = await import('../../src/middleware/rateLimiter.js');

    // Find the POST /refresh route layer in the Express router stack
    const refreshRoute = authRouter.stack.find(
      (layer) => layer.route?.path === '/refresh' && layer.route?.methods?.post,
    );

    expect(refreshRoute).toBeDefined();

    // Check whether authLimiter appears in the route's handler stack
    const routeHandlers = refreshRoute?.route?.stack ?? [];
    const hasAuthLimiter = routeHandlers.some(
      (handler: { handle?: unknown }) => handler.handle === authLimiter,
    );

    // After fix: hasAuthLimiter should be true
    // Before fix: it is false — this test FAILS
    expect(hasAuthLimiter).toBe(true);
  });

  it('✅ POST /login IS protected by authLimiter', async () => {
    const { authRouter } = await import('../../src/modules/auth/auth.routes.js');
    const { authLimiter } = await import('../../src/middleware/rateLimiter.js');

    const loginRoute = authRouter.stack.find(
      (layer) => layer.route?.path === '/login' && layer.route?.methods?.post,
    );

    expect(loginRoute).toBeDefined();

    const routeHandlers = loginRoute?.route?.stack ?? [];
    const hasAuthLimiter = routeHandlers.some(
      (handler: { handle?: unknown }) => handler.handle === authLimiter,
    );

    expect(hasAuthLimiter).toBe(true);
  });

  it('✅ POST /register IS protected by authLimiter', async () => {
    const { authRouter } = await import('../../src/modules/auth/auth.routes.js');
    const { authLimiter } = await import('../../src/middleware/rateLimiter.js');

    const registerRoute = authRouter.stack.find(
      (layer) => layer.route?.path === '/register' && layer.route?.methods?.post,
    );

    expect(registerRoute).toBeDefined();

    const routeHandlers = registerRoute?.route?.stack ?? [];
    const hasAuthLimiter = routeHandlers.some(
      (handler: { handle?: unknown }) => handler.handle === authLimiter,
    );

    expect(hasAuthLimiter).toBe(true);
  });
});

// ─── aiRateLimiter: correct behaviour ────────────────────────

describe('aiRateLimiter — per-user daily limit (correct behaviour)', () => {
  beforeEach(() => jest.clearAllMocks());

  const today = new Date().toISOString().split('T')[0] as string;

  function buildReq(userId = 'user-1'): Request {
    return { user: { sub: userId } } as unknown as Request;
  }

  function buildRes(): { status: jest.Mock; json: jest.Mock } {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return { status, json };
  }

  it('✅ allows request when user is under 50/day', async () => {
    mockRedisIncr.mockResolvedValue(25 as never); // 25th request today

    const req = buildReq();
    const res = buildRes() as unknown as Response;
    const next = jest.fn();

    await aiRateLimiter(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('✅ allows exactly the 50th request', async () => {
    mockRedisIncr.mockResolvedValue(50 as never);

    const req = buildReq();
    const res = buildRes() as unknown as Response;
    const next = jest.fn();

    await aiRateLimiter(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('✅ blocks the 51st request with 429', async () => {
    mockRedisIncr.mockResolvedValue(51 as never);

    const req = buildReq();
    const res = buildRes() as unknown as Response;
    const next = jest.fn();

    await aiRateLimiter(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('✅ sets TTL on the first request of the day', async () => {
    mockRedisIncr.mockResolvedValue(1 as never); // First request

    const req = buildReq();
    const next = jest.fn();

    await aiRateLimiter(req, buildRes() as unknown as Response, next);

    expect(mockRedisExpire).toHaveBeenCalledWith(
      RedisKeys.aiDailyRequests('user-1', today),
      24 * 60 * 60,
    );
  });

  it('✅ allows request with no authenticated user (skips rate limiting)', async () => {
    const req = { user: undefined } as unknown as Request;
    const next = jest.fn();

    await aiRateLimiter(req, buildRes() as unknown as Response, next);

    expect(next).toHaveBeenCalled();
    expect(mockRedisIncr).not.toHaveBeenCalled();
  });
});
