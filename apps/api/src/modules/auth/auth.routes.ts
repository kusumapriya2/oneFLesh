// ============================================================
// OneFlesh — Auth Routes
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import {
  handleRegister,
  handleLogin,
  handleMfaVerify,
  handleMfaSetup,
  handleMfaEnable,
  handleRefresh,
  handleLogout,
  handleForgotPassword,
  handleResetPassword,
  handleListSessions,
  handleRevokeSession,
} from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter, passwordResetLimiter } from '../../middleware/rateLimiter.js';
import { validateBody } from '../../middleware/validate.js';
import {
  RegisterSchema,
  LoginSchema,
  MfaVerifySchema,
  MfaEnableSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '@oneflesh/shared';

// Explicit type annotation fixes TS2742
export const authRouter: Router = Router();

// Public routes
authRouter.post(
  '/register',
  authLimiter,
  validateBody(RegisterSchema),
  (req: Request, res: Response, next: NextFunction) => handleRegister(req, res, next),
);

authRouter.post(
  '/login',
  authLimiter,
  validateBody(LoginSchema),
  (req: Request, res: Response, next: NextFunction) => handleLogin(req, res, next),
);

authRouter.post(
  '/mfa/verify',
  authLimiter,
  validateBody(MfaVerifySchema),
  (req: Request, res: Response, next: NextFunction) => handleMfaVerify(req, res, next),
);

authRouter.post(
  '/refresh',
  authLimiter, // H-08: rate-limit token refresh
  (req: Request, res: Response, next: NextFunction) => handleRefresh(req, res, next),
);

authRouter.post(
  '/forgot-password',
  passwordResetLimiter,
  validateBody(ForgotPasswordSchema),
  (req: Request, res: Response, next: NextFunction) => handleForgotPassword(req, res, next),
);

authRouter.post(
  '/reset-password',
  validateBody(ResetPasswordSchema),
  (req: Request, res: Response, next: NextFunction) => handleResetPassword(req, res, next),
);

// Protected routes
authRouter.post(
  '/mfa/setup',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => handleMfaSetup(req, res, next),
);

authRouter.post(
  '/mfa/enable',
  authenticate,
  validateBody(MfaEnableSchema),
  (req: Request, res: Response, next: NextFunction) => handleMfaEnable(req, res, next),
);

authRouter.post(
  '/logout',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => handleLogout(req, res, next),
);

authRouter.get(
  '/sessions',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => handleListSessions(req, res, next),
);

authRouter.delete(
  '/sessions/:id',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => handleRevokeSession(req, res, next),
);
