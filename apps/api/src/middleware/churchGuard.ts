// ============================================================
// OneFlesh — Church Guard Middleware (ABAC row-level security)
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@oneflesh/shared';
import { prisma } from '../config/database.js';
import { sendError } from '../utils/response.js';

/**
 * Ensures pastors can only operate within their church context.
 * Super admins and church admins pass through.
 */
export async function churchGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
    return;
  }

  // Super admins bypass church guard
  if (req.user.role === UserRole.SUPER_ADMIN) {
    next();
    return;
  }

  // Pastors and church admins must belong to an approved church
  if (
    req.user.role === UserRole.PASTOR ||
    req.user.role === UserRole.CHURCH_ADMIN
  ) {
    if (!req.user.churchId) {
      sendError(res, 403, 'NO_CHURCH', 'You are not associated with an approved church');
      return;
    }

    // Verify church is still approved
    const church = await prisma.church.findUnique({
      where: { id: req.user.churchId },
      select: { id: true, status: true },
    });

    if (!church || church.status !== 'APPROVED') {
      sendError(res, 403, 'CHURCH_NOT_APPROVED', 'Your church is not currently approved on this platform');
      return;
    }
  }

  next();
}
