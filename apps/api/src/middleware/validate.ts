// ============================================================
// OneFlesh — Zod Request Validation Middleware
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import type { ZodType, ZodTypeDef } from 'zod';

export function validateBody<T>(schema: ZodType<T, ZodTypeDef, unknown>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodType<T, ZodTypeDef, unknown>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
