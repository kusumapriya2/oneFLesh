// ============================================================
// OneFlesh — Global Error Handler
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log all errors
  logger.error('Request error:', {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    method: req.method,
    path: req.path,
    userId: req.user?.sub,
  });

  // App errors (intentionally thrown)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.field ? { field: err.field } : {}),
      },
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const firstError = err.errors[0];
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: firstError?.message ?? 'Validation failed',
        field: firstError?.path.join('.'),
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.['target'] as string[]) ?? [];
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `A record with this ${fields.join(', ')} already exists`,
          field: fields[0],
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Record not found' },
      });
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_DATA', message: 'Invalid data provided' },
    });
    return;
  }

  // Generic 500 — never expose stack in production
  const message = env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : (err instanceof Error ? err.message : 'Unknown error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      ...(env.NODE_ENV !== 'production' && err instanceof Error
        ? { details: err.stack }
        : {}),
    },
  });
}
