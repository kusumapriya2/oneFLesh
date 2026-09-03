// ============================================================
// OneFlesh — Notifications Routes
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { authenticate } from '../../middleware/authenticate.js';
import { sendSuccess, sendNoContent, paginate } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';

export const notificationRouter: Router = Router();

// ─── GET / — Paginated list of user's notifications ───────────
async function handleList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const page = Number(req.query['page'] ?? 1);
    const limit = Number(req.query['limit'] ?? 20);

    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    sendSuccess(res, items, 200, paginate(total, page, limit));
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /:id/read — Mark single notification as read ───────
async function handleMarkRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const id = req.params['id'] as string;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw new AppError(404, 'NOTIFICATION_NOT_FOUND', `Notification ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to update this notification');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /read-all — Mark all as read ───────────────────────
async function handleMarkAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    sendSuccess(res, { message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /:id — Delete notification ───────────────────────
async function handleDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const id = req.params['id'] as string;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw new AppError(404, 'NOTIFICATION_NOT_FOUND', `Notification ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to delete this notification');
    }

    await prisma.notification.delete({ where: { id } });

    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

// ─── Route definitions ────────────────────────────────────────

// IMPORTANT: /read-all must be defined before /:id to avoid param collision
notificationRouter.get('/', authenticate, handleList);
notificationRouter.patch('/read-all', authenticate, handleMarkAllRead);
notificationRouter.patch('/:id/read', authenticate, handleMarkRead);
notificationRouter.delete('/:id', authenticate, handleDelete);
