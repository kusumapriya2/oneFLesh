// ============================================================
// OneFlesh — Consistent API Response Helpers
// ============================================================

import type { Response } from 'express';
import type { ApiResponse, PaginationMeta } from '@oneflesh/shared';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta,
): void {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  field?: string,
): void {
  const response: ApiResponse = {
    success: false,
    error: { code, message, ...(field ? { field } : {}) },
  };
  res.status(statusCode).json(response);
}

export function paginate(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
