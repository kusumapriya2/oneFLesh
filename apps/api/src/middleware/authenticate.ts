// ============================================================
// OneFlesh — JWT Authentication Middleware
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtKeys } from '../config/jwt.js';
import { redis, RedisKeys } from '../config/redis.js';
import { sendError } from '../utils/response.js';
import type { JwtPayload } from '@oneflesh/shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload & { jti?: string };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'No authentication token provided');
    return;
  }

  const token = authHeader.slice(7);

  try {
    const { publicKey } = getJwtKeys();
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload & {
      jti?: string;
    };

    // Check token blacklist
    if (payload.jti) {
      const blacklisted = await redis.exists(RedisKeys.tokenBlacklist(payload.jti));
      if (blacklisted) {
        sendError(res, 401, 'TOKEN_REVOKED', 'Authentication token has been revoked');
        return;
      }
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendError(res, 401, 'TOKEN_EXPIRED', 'Authentication token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      sendError(res, 401, 'TOKEN_INVALID', 'Authentication token is invalid');
    } else {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication failed');
    }
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  try {
    const { publicKey } = getJwtKeys();
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload & {
      jti?: string;
    };
    req.user = payload;
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
}
