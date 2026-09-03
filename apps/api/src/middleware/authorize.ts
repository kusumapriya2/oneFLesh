// ============================================================
// OneFlesh — RBAC Authorization Middleware
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@oneflesh/shared';
import { sendError } from '../utils/response.js';

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      sendError(
        res,
        403,
        'FORBIDDEN',
        `Access denied. Required roles: ${roles.join(', ')}`,
      );
      return;
    }

    next();
  };
}

// Convenience helpers
export const requireAdmin = authorize(UserRole.SUPER_ADMIN);
export const requireAdminOrChurchAdmin = authorize(UserRole.SUPER_ADMIN, UserRole.CHURCH_ADMIN);
export const requirePastor = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.CHURCH_ADMIN,
  UserRole.PASTOR,
);
export const requireVendor = authorize(UserRole.VENDOR);
export const requireAnyAuth = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.CHURCH_ADMIN,
  UserRole.PASTOR,
  UserRole.VENDOR,
  UserRole.READ_ONLY,
);
