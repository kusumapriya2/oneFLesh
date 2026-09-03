// ============================================================
// OneFlesh — Request Logger Middleware
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = uuidv4();
  const startTime = Date.now();

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.sub ?? 'anonymous',
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', logData);
    } else {
      logger.info('Request completed', logData);
    }

    // P95 warning
    if (duration > 800) {
      logger.warn(`Slow request P95 threshold exceeded: ${duration}ms`, {
        method: req.method,
        path: req.path,
      });
    }
  });

  next();
}
