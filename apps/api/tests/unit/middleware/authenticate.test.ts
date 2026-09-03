// ============================================================
// OneFlesh — Authenticate Middleware Unit Tests
// Covers: M-03 (optionalAuth skips JWT blacklist check)
// ============================================================

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  TokenExpiredError: class TokenExpiredError extends Error { constructor() { super('expired'); } },
  JsonWebTokenError: class JsonWebTokenError extends Error { constructor() { super('invalid'); } },
}));

jest.mock('../../../src/config/jwt.js', () => ({
  getJwtKeys: jest.fn().mockReturnValue({ publicKey: 'mock-public-key' }),
}));

jest.mock('../../../src/config/redis.js', () => ({
  redis: { exists: jest.fn() },
  RedisKeys: {
    tokenBlacklist: (jti: string) => `bl:${jti}`,
  },
}));

jest.mock('../../../src/utils/response.js', () => ({
  sendError: jest.fn(),
}));

// ─── Imports ─────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis } from '../../../src/config/redis.js';
import { sendError } from '../../../src/utils/response.js';
import { authenticate, optionalAuth } from '../../../src/middleware/authenticate.js';

const mockJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;
const mockRedisExists = redis.exists as jest.MockedFunction<typeof redis.exists>;
const mockSendError = sendError as jest.MockedFunction<typeof sendError>;

// ─── Helpers ─────────────────────────────────────────────────

function buildReq(token?: string): Request {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as unknown as Request;
}

function buildRes(): Response {
  return {} as Response;
}

// ─── authenticate: correct behaviour (baseline) ───────────────

describe('authenticate — correct behaviour', () => {
  beforeEach(() => jest.clearAllMocks());

  it('✅ rejects blacklisted token (jti in Redis)', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-1', jti: 'jti-blacklisted', role: 'PASTOR' } as never);
    mockRedisExists.mockResolvedValue(1 as never); // Token IS blacklisted

    const req = buildReq('valid-token');
    const next = jest.fn();
    await authenticate(req, buildRes(), next);

    expect(next).not.toHaveBeenCalled();
    expect(mockSendError).toHaveBeenCalledWith(
      expect.anything(),
      401,
      'TOKEN_REVOKED',
      expect.any(String),
    );
  });

  it('✅ allows valid non-blacklisted token', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-1', jti: 'jti-valid', role: 'PASTOR' } as never);
    mockRedisExists.mockResolvedValue(0 as never); // NOT blacklisted

    const req = buildReq('valid-token') as Request & { user?: unknown };
    const next = jest.fn();
    await authenticate(req, buildRes(), next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ sub: 'user-1', jti: 'jti-valid' });
  });

  it('✅ rejects request with no token', async () => {
    const req = buildReq();
    const next = jest.fn();
    await authenticate(req, buildRes(), next);

    expect(next).not.toHaveBeenCalled();
    expect(mockSendError).toHaveBeenCalledWith(expect.anything(), 401, 'UNAUTHORIZED', expect.any(String));
  });

  it('✅ rejects expired token', async () => {
    mockJwtVerify.mockImplementation(() => { throw new jwt.TokenExpiredError(); });

    const req = buildReq('expired-token');
    const next = jest.fn();
    await authenticate(req, buildRes(), next);

    expect(next).not.toHaveBeenCalled();
    expect(mockSendError).toHaveBeenCalledWith(expect.anything(), 401, 'TOKEN_EXPIRED', expect.any(String));
  });
});

// ─── M-03: optionalAuth Skips Blacklist Check ─────────────────

describe('M-03 · optionalAuth — blacklist check', () => {
  beforeEach(() => jest.clearAllMocks());

  it('⚠️  FAILS BEFORE FIX — optionalAuth should reject blacklisted tokens', async () => {
    // Token is valid and has a jti
    mockJwtVerify.mockReturnValue({ sub: 'user-1', jti: 'jti-blacklisted', role: 'PASTOR' } as never);
    // But the token IS in the blacklist (e.g. user logged out)
    mockRedisExists.mockResolvedValue(1 as never);

    const req = buildReq('a-revoked-token') as Request & { user?: unknown };
    const next = jest.fn();

    await optionalAuth(req, buildRes(), next);

    // After fix: req.user should be undefined — blacklisted tokens should not attach
    // Before fix: req.user IS populated (blacklist check missing) — test FAILS
    expect(req.user).toBeUndefined();

    // next() must still be called (optional auth never blocks the request)
    expect(next).toHaveBeenCalled();
  });

  it('✅ attaches user for a valid, non-blacklisted token', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-1', jti: 'jti-ok', role: 'PASTOR' } as never);
    mockRedisExists.mockResolvedValue(0 as never); // NOT blacklisted

    const req = buildReq('valid-token') as Request & { user?: unknown };
    const next = jest.fn();

    await optionalAuth(req, buildRes(), next);

    expect(req.user).toMatchObject({ sub: 'user-1' });
    expect(next).toHaveBeenCalled();
  });

  it('✅ proceeds without attaching user when no token is present', async () => {
    const req = buildReq() as Request & { user?: unknown };
    const next = jest.fn();

    await optionalAuth(req, buildRes(), next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
    // Redis should not be queried at all
    expect(mockRedisExists).not.toHaveBeenCalled();
  });

  it('✅ proceeds silently when token is malformed (no error thrown)', async () => {
    mockJwtVerify.mockImplementation(() => { throw new jwt.JsonWebTokenError(); });

    const req = buildReq('bad-token') as Request & { user?: unknown };
    const next = jest.fn();

    await optionalAuth(req, buildRes(), next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
