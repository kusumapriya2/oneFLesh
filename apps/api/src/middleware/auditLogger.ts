// ============================================================
// OneFlesh — Audit Logger Middleware
// ============================================================

import type { Request } from 'express';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';
import type { AuditAction } from '@oneflesh/shared';

interface AuditOptions {
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(
  req: Request,
  options: AuditOptions,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.sub ?? null,
        action: options.action,
        entityType: options.entityType ?? null,
        entityId: options.entityId ?? null,
        metadata: options.metadata ?? {},
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      },
    });
  } catch (error) {
    // Audit failures should never break the main flow
    logger.error('Failed to write audit log:', error);
  }
}
