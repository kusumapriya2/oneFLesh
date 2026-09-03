// ============================================================
// OneFlesh — Alliances Routes
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as allianceService from './alliances.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePastor } from '../../middleware/authorize.js';
import { churchGuard } from '../../middleware/churchGuard.js';
import { validateBody } from '../../middleware/validate.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import {
  CreateAllianceSchema,
  AdvanceAllianceSchema,
  AddAllianceNoteSchema,
} from '@oneflesh/shared';
import type { UserRole } from '@oneflesh/shared';

export const allianceRouter: Router = Router();

// ─── POST / — Create alliance ─────────────────────────────────
async function handleCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alliance = await allianceService.createAlliance(req.body, req.user!.sub);
    sendCreated(res, alliance);
  } catch (err) {
    next(err);
  }
}

// ─── GET / — List alliances ───────────────────────────────────
async function handleList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query['page'] ?? 1);
    const limit = Number(req.query['limit'] ?? 20);
    const status = req.query['status'] as string | undefined;
    const stage = req.query['stage'] ? Number(req.query['stage']) : undefined;

    const filters = { page, limit, ...(status !== undefined && { status }), ...(stage !== undefined && { stage }) };
    const result = await allianceService.listAlliances(
      req.user!.sub,
      req.user!.role as UserRole,
      filters,
    );

    sendSuccess(res, result.items, 200, result.meta);
  } catch (err) {
    next(err);
  }
}

// ─── GET /:id — Get alliance ──────────────────────────────────
async function handleGet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alliance = await allianceService.getAlliance(req.params['id'] as string);
    sendSuccess(res, alliance);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /:id/advance ───────────────────────────────────────
async function handleAdvance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alliance = await allianceService.advanceAlliance(
      req.params['id'] as string,
      req.body,
      req.user!.sub,
    );
    sendSuccess(res, alliance);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /:id/dissolve ─────────────────────────────────────
async function handleDissolve(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const alliance = await allianceService.dissolveAlliance(
      req.params['id'] as string,
      req.user!.sub,
    );
    sendSuccess(res, alliance);
  } catch (err) {
    next(err);
  }
}

// ─── POST /:id/notes — Add note ───────────────────────────────
async function handleAddNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const note = await allianceService.addNote(
      req.params['id'] as string,
      req.user!.sub,
      (req.body as { content: string }).content,
    );
    sendCreated(res, note);
  } catch (err) {
    next(err);
  }
}

// ─── GET /:id/notes — Get notes ───────────────────────────────
async function handleGetNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notes = await allianceService.getNotes(req.params['id'] as string);
    sendSuccess(res, notes);
  } catch (err) {
    next(err);
  }
}

// ─── Route definitions ────────────────────────────────────────
allianceRouter.post(
  '/',
  authenticate,
  churchGuard,
  requirePastor,
  validateBody(CreateAllianceSchema),
  handleCreate,
);

allianceRouter.get('/', authenticate, requirePastor, handleList);

allianceRouter.get('/:id', authenticate, requirePastor, handleGet);

allianceRouter.patch(
  '/:id/advance',
  authenticate,
  requirePastor,
  validateBody(AdvanceAllianceSchema),
  handleAdvance,
);

allianceRouter.patch('/:id/dissolve', authenticate, requirePastor, handleDissolve);

allianceRouter.post(
  '/:id/notes',
  authenticate,
  requirePastor,
  validateBody(AddAllianceNoteSchema),
  handleAddNote,
);

allianceRouter.get('/:id/notes', authenticate, requirePastor, handleGetNotes);
