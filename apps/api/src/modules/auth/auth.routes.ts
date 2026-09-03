// ============================================================
// OneFlesh — Auth Routes
// ============================================================

import { Router } from 'express';
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

export const authRouter = Router();

// Public routes
authRouter.post('/register', authLimiter, validateBody(RegisterSchema), handleRegister);
authRouter.post('/login', authLimiter, validateBody(LoginSchema), handleLogin);
authRouter.post('/mfa/verify', authLimiter, validateBody(MfaVerifySchema), handleMfaVerify);
authRouter.post('/refresh', authLimiter, handleRefresh); // H-08: rate-limit token refresh
authRouter.post(
  '/forgot-password',
  passwordResetLimiter,
  validateBody(ForgotPasswordSchema),
  handleForgotPassword,
);
authRouter.post('/reset-password', validateBody(ResetPasswordSchema), handleResetPassword);

// Protected routes
authRouter.post('/mfa/setup', authenticate, handleMfaSetup);
authRouter.post('/mfa/enable', authenticate, validateBody(MfaEnableSchema), handleMfaEnable);
authRouter.post('/logout', authenticate, handleLogout);
authRouter.get('/sessions', authenticate, handleListSessions);
authRouter.delete('/sessions/:id', authenticate, handleRevokeSession);
