// ============================================================
// OneFlesh — Counselling Routes
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as counsellingService from './counselling.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePastor } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validate.js';
import { aiRateLimiter } from '../../middleware/rateLimiter.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import {
  CreateCounsellingSchema,
  CompleteSessionSchema,
} from '@oneflesh/shared';
import type { UserRole } from '@oneflesh/shared';

export const counsellingRouter = Router();

// ─── POST / — Register couple (creates 6 sessions) ───────────
async function handleRegisterCouple(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessions = await counsellingService.registerCouple(req.body);
    sendCreated(res, sessions);
  } catch (err) {
    next(err);
  }
}

// ─── GET / — List sessions ────────────────────────────────────
async function handleList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query['page'] ?? 1);
    const limit = Number(req.query['limit'] ?? 20);

    const result = await counsellingService.listSessions(
      req.user!.sub,
      req.user!.role as UserRole,
      page,
      limit,
    );

    sendSuccess(res, result.items, 200, result.meta);
  } catch (err) {
    next(err);
  }
}

// ─── GET /:id — Get session ───────────────────────────────────
async function handleGet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await counsellingService.getSession(req.params['id'] as string);
    sendSuccess(res, session);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /:id/complete — Complete session ───────────────────
async function handleComplete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await counsellingService.completeSession(
      req.params['id'] as string,
      req.body,
      req.user!.sub,
    );
    sendSuccess(res, session);
  } catch (err) {
    next(err);
  }
}

// ─── GET /:id/certificate — PDF certificate ───────────────────
async function handleCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pdfBuffer = await counsellingService.generateCertificate(req.params['id'] as string);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="counselling-certificate.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).end(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

// ─── GET /:id/questions — AI counselling questions ────────────
async function handleQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const questions = await counsellingService.getSessionQuestions(
      req.params['id'] as string,
      req.user!.sub,
    );
    sendSuccess(res, questions);
  } catch (err) {
    next(err);
  }
}

// ─── Route definitions ────────────────────────────────────────

counsellingRouter.post(
  '/',
  authenticate,
  requirePastor,
  validateBody(CreateCounsellingSchema),
  handleRegisterCouple,
);

counsellingRouter.get('/', authenticate, requirePastor, handleList);

counsellingRouter.get('/:id', authenticate, requirePastor, handleGet);

counsellingRouter.patch(
  '/:id/complete',
  authenticate,
  requirePastor,
  validateBody(CompleteSessionSchema),
  handleComplete,
);

counsellingRouter.get('/:id/certificate', authenticate, requirePastor, handleCertificate);

counsellingRouter.get('/:id/questions', authenticate, requirePastor, aiRateLimiter, handleQuestions);
