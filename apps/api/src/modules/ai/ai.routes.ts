// ============================================================
// OneFlesh — AI Routes
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as aiService from './ai.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePastor } from '../../middleware/authorize.js';
import { validateBody } from '../../middleware/validate.js';
import { aiRateLimiter } from '../../middleware/rateLimiter.js';
import { sendSuccess } from '../../utils/response.js';
import {
  AIMatchSchema,
  AILetterSchema,
  AICounsellingQuestionsSchema,
  AIAllianceSummarySchema,
  AIChatSchema,
  COUNSELLING_SESSIONS,
} from '@oneflesh/shared';

export const aiRouter = Router();

// ─── POST /match — Match scoring ─────────────────────────────
async function handleMatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const results = await aiService.getMatchScores(req.body, req.user!.sub);
    sendSuccess(res, results);
  } catch (err) {
    next(err);
  }
}

// ─── POST /letter — Draft introduction letter ─────────────────
async function handleLetter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const letter = await aiService.draftLetter(req.body, req.user!.sub);
    sendSuccess(res, { letter });
  } catch (err) {
    next(err);
  }
}

// ─── POST /counselling-questions — Session questions ──────────
async function handleCounsellingQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionNumber, allianceId } = req.body as {
      sessionNumber: number;
      allianceId?: string;
    };

    // Derive topic and scripture from canonical session definitions
    const sessionDef = COUNSELLING_SESSIONS.find((s) => s.session === sessionNumber);

    if (!sessionDef) {
      res.status(422).json({
        success: false,
        error: { code: 'INVALID_SESSION_NUMBER', message: `Session number must be 1–6` },
      });
      return;
    }

    const questions = await aiService.generateCounsellingQuestions(
      sessionNumber,
      sessionDef.topic,
      sessionDef.scripture,
      req.user!.sub,
    );

    sendSuccess(res, { questions, sessionNumber, topic: sessionDef.topic, allianceId });
  } catch (err) {
    next(err);
  }
}

// ─── POST /alliance-summary — Alliance summary ────────────────
async function handleAllianceSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await aiService.generateAllianceSummary(req.body, req.user!.sub);
    sendSuccess(res, { summary });
  } catch (err) {
    next(err);
  }
}

// ─── POST /chat — Pastoral AI chat ───────────────────────────
async function handleChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const response = await aiService.chat(req.body, req.user!.sub);
    sendSuccess(res, { response });
  } catch (err) {
    next(err);
  }
}

// ─── Route definitions ────────────────────────────────────────

aiRouter.post(
  '/match',
  authenticate,
  requirePastor,
  aiRateLimiter,
  validateBody(AIMatchSchema),
  handleMatch,
);

aiRouter.post(
  '/letter',
  authenticate,
  requirePastor,
  aiRateLimiter,
  validateBody(AILetterSchema),
  handleLetter,
);

aiRouter.post(
  '/counselling-questions',
  authenticate,
  requirePastor,
  aiRateLimiter,
  validateBody(AICounsellingQuestionsSchema),
  handleCounsellingQuestions,
);

aiRouter.post(
  '/alliance-summary',
  authenticate,
  requirePastor,
  aiRateLimiter,
  validateBody(AIAllianceSummarySchema),
  handleAllianceSummary,
);

aiRouter.post(
  '/chat',
  authenticate,
  requirePastor,
  aiRateLimiter,
  validateBody(AIChatSchema),
  handleChat,
);
