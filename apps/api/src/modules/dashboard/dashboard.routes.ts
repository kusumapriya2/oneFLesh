// ============================================================
// OneFlesh — Dashboard Routes
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin, requirePastor } from '../../middleware/authorize.js';
import { churchGuard } from '../../middleware/churchGuard.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';

export const dashboardRouter: Router = Router();

// ─── GET /pastor — Pastor dashboard ──────────────────────────
async function handlePastorDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.sub;
    const churchId = req.user!.churchId;

    if (!churchId) {
      throw new AppError(403, 'NO_CHURCH', 'You are not associated with a church');
    }

    const raw = await dashboardService.getPastorDashboard(userId, churchId);

    // Reshape into the nested structure the frontend DashboardPage expects
    sendSuccess(res, {
      stats: {
        activeProfiles: raw.activeProfiles,
        alliancesInProgress: raw.alliancesInProgress,
        pendingInterests: raw.pendingInterests,
        upcomingCounsellingSessions: raw.upcomingSessions.length,
      },
      alliances: raw.activeAlliances,
      profiles: raw.myProfiles,
      upcomingSessions: raw.upcomingSessions,
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET /public-stats — Unauthenticated hero counters ────────
async function handlePublicStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await dashboardService.getPublicStats();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

// ─── GET /admin — Admin dashboard ────────────────────────────
async function handleAdminDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await dashboardService.getAdminDashboard();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

// ─── Route definitions ────────────────────────────────────────

dashboardRouter.get('/public-stats', handlePublicStats); // no auth — public home page counters
dashboardRouter.get('/pastor', authenticate, requirePastor, churchGuard, handlePastorDashboard);
dashboardRouter.get('/admin', authenticate, requireAdmin, handleAdminDashboard);
