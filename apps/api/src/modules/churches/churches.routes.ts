// ============================================================
// OneFlesh — Churches Routes
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as churchService from './churches.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import {
  requireAdmin,
  requireAdminOrChurchAdmin,
} from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';
import {
  CreateChurchSchema,
  RejectChurchSchema,
  UpdateChurchSchema,
} from '@oneflesh/shared';
import type { UserRole } from '@oneflesh/shared';

export const churchRouter = Router();

// ─── POST / — Create a church ─────────────────────────────────
async function handleCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const church = await churchService.createChurch(req.body);
    sendCreated(res, church);
  } catch (err) {
    next(err);
  }
}

// ─── GET / — List churches (super admin) ──────────────────────
async function handleList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query['page'] ?? 1);
    const limit = Number(req.query['limit'] ?? 20);
    const status = req.query['status'] as string | undefined;

    const result = await churchService.listChurches({ status, page, limit });
    sendSuccess(res, result.items, 200, result.meta);
  } catch (err) {
    next(err);
  }
}

// ─── GET /:id — Get church by ID ──────────────────────────────
async function handleGet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const church = await churchService.getChurch(req.params['id'] as string);
    sendSuccess(res, church);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /:id/approve ───────────────────────────────────────
async function handleApprove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const church = await churchService.approveChurch(
      req.params['id'] as string,
      req.user!.sub,
    );
    sendSuccess(res, church);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /:id/reject ────────────────────────────────────────
async function handleReject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const church = await churchService.rejectChurch(
      req.params['id'] as string,
      (req.body as { reason: string }).reason,
      req.user!.sub,
    );
    sendSuccess(res, church);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /:id — Update church ───────────────────────────────
async function handleUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const church = await churchService.updateChurch(
      req.params['id'] as string,
      req.body,
      req.user!.sub,
      req.user!.role as UserRole,
    );
    sendSuccess(res, church);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /:id — Soft-delete (suspend) church ───────────────
async function handleDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await churchService.deleteChurch(req.params['id'] as string);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

// ─── Route definitions ────────────────────────────────────────
churchRouter.post(
  '/',
  authenticate,
  requireAdminOrChurchAdmin,
  validateBody(CreateChurchSchema),
  handleCreate,
);

churchRouter.get('/', authenticate, requireAdmin, handleList);

churchRouter.get('/:id', authenticate, handleGet);

churchRouter.patch('/:id/approve', authenticate, requireAdmin, handleApprove);

churchRouter.patch(
  '/:id/reject',
  authenticate,
  requireAdmin,
  validateBody(RejectChurchSchema),
  handleReject,
);

churchRouter.patch(
  '/:id',
  authenticate,
  requireAdminOrChurchAdmin,
  validateBody(UpdateChurchSchema),
  handleUpdate,
);

churchRouter.delete('/:id', authenticate, requireAdmin, handleDelete);
