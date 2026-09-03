// ============================================================
// OneFlesh — Auth Controller
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';
import { writeAuditLog } from '../../middleware/auditLogger.js';
import { AuditAction } from '@oneflesh/shared';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: env.JWT_REFRESH_TTL * 1000,
  path: '/api/v1/auth',
};

export async function handleRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.registerChurch(req.body);
    await writeAuditLog(req, {
      action: AuditAction.REGISTER,
      entityType: 'Church',
      entityId: result.churchId,
    });
    sendCreated(res, { message: 'Church registration submitted. Awaiting admin approval.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body, req.ip ?? '');

    if (result.requiresMfa) {
      sendSuccess(res, { requiresMfa: true, tempToken: result.tempToken });
      return;
    }

    if (result.tokens) {
      res.cookie('refreshToken', result.tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
      sendSuccess(res, {
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
        requiresMfa: false,
      });
    }

    await writeAuditLog(req, { action: AuditAction.LOGIN });
  } catch (err) {
    next(err);
  }
}

export async function handleMfaVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tokens = await authService.verifyMfa(req.body);
    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn });
    await writeAuditLog(req, { action: AuditAction.LOGIN });
  } catch (err) {
    next(err);
  }
}

export async function handleMfaSetup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.setupMfa(req.user!.sub);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function handleMfaEnable(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.enableMfa(req.user!.sub, req.body);
    await writeAuditLog(req, { action: AuditAction.MFA_ENABLED });
    sendSuccess(res, { message: 'MFA enabled successfully' });
  } catch (err) {
    next(err);
  }
}

export async function handleRefresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookieToken = req.cookies['refreshToken'] as string | undefined;
    if (!cookieToken) {
      res.status(401).json({
        success: false,
        error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' },
      });
      return;
    }

    const tokens = await authService.refreshTokens(cookieToken);
    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    sendSuccess(res, { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn });
  } catch (err) {
    next(err);
  }
}

export async function handleLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookieToken = req.cookies['refreshToken'] as string | undefined;
    if (cookieToken) {
      await authService.logout(req.user!.sub, cookieToken, req.user!.jti);
    }
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    await writeAuditLog(req, { action: AuditAction.LOGOUT });
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function handleForgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.forgotPassword(req.body);
    sendSuccess(res, { message: 'If that email is registered, a password reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function handleResetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.resetPassword(req.body);
    await writeAuditLog(req, { action: AuditAction.PASSWORD_RESET });
    sendSuccess(res, { message: 'Password reset successfully. Please log in with your new password.' });
  } catch (err) {
    next(err);
  }
}

export async function handleListSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessions = await authService.listSessions(req.user!.sub);
    sendSuccess(res, { sessions });
  } catch (err) {
    next(err);
  }
}

export async function handleRevokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.revokeSession(req.user!.sub, req.params['id'] as string);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}
