// ============================================================
// OneFlesh — Auth Service
// ============================================================

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database.js';
import { redis, RedisKeys, RedisTTL } from '../../config/redis.js';
import { getJwtKeys } from '../../config/jwt.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { generateSecureToken, hashToken } from '../../utils/crypto.js';
import { sendEmail, EmailTemplates } from '../../utils/email.js';
import { sendSMS, SMSTemplates } from '../../utils/sms.js';
import { AppError } from '../../middleware/errorHandler.js';
import type {
  LoginInput,
  RegisterInput,
  MfaVerifyInput,
  MfaEnableInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  AuthTokens,
  MfaSetupResponse,
  JwtPayload,
} from '@oneflesh/shared';
import { UserRole } from '@oneflesh/shared';

// ─── Token helpers ────────────────────────────────────────────
function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const { privateKey } = getJwtKeys();
  return jwt.sign({ ...payload, jti: uuidv4() }, privateKey, {
    algorithm: 'RS256',
    expiresIn: env.JWT_ACCESS_TTL,
  });
}

async function issueRefreshToken(userId: string): Promise<string> {
  const sessionId = uuidv4();
  const token = generateSecureToken(40);
  const hashedToken = hashToken(token);

  await redis.setex(
    RedisKeys.refreshToken(userId, sessionId),
    RedisTTL.REFRESH_TOKEN,
    hashedToken,
  );

  // H-02: Track session in a sorted set (score = insertion timestamp) for FIFO eviction.
  // Migration guard: if the key was written by old code as a plain Set, delete it so ZADD
  // doesn't throw WRONGTYPE. Old tokens are invalid after the H-03 format change anyway.
  const sessionsKey = RedisKeys.userSessions(userId);
  const keyType = await redis.type(sessionsKey);
  if (keyType === 'set') {
    await redis.del(sessionsKey);
    logger.info(`[auth] Migrated userSessions key from Set→ZSet for user=${userId}`);
  }

  await redis.zadd(sessionsKey, Date.now(), sessionId);

  // H-02: Enforce MAX_CONCURRENT_SESSIONS — evict oldest excess sessions atomically
  const count = await redis.zcard(sessionsKey);
  if (count > env.MAX_CONCURRENT_SESSIONS) {
    const excess = count - env.MAX_CONCURRENT_SESSIONS;
    const oldest = await redis.zrange(sessionsKey, 0, excess - 1);
    for (const oldSessionId of oldest) {
      await redis.del(RedisKeys.refreshToken(userId, oldSessionId));
      await redis.zrem(sessionsKey, oldSessionId);
      logger.debug(`Session evicted (limit ${env.MAX_CONCURRENT_SESSIONS} reached): user=${userId} session=${oldSessionId}`);
    }
  }

  // H-03: Embed userId in the token so refreshTokens() can construct the Redis key
  // directly without an O(N) KEYS scan. Format: "${userId}.${sessionId}.${token}"
  // — all three segments are dot-free (CUID, UUID with dashes, hex)
  return `${userId}.${sessionId}.${token}`;
}

// ─── Register ─────────────────────────────────────────────────
export async function registerChurch(data: RegisterInput): Promise<{ userId: string; churchId: string }> {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
  }

  const existingChurch = await prisma.church.findUnique({
    where: { pastorEmail: data.email },
  });
  if (existingChurch) {
    throw new AppError(409, 'CHURCH_EXISTS', 'A church with this pastor email already exists');
  }

  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

  const result = await prisma.$transaction(async (tx) => {
    const church = await tx.church.create({
      data: {
        name: data.churchName,
        denomination: data.denomination,
        city: data.city,
        state: data.state,
        pastorName: data.pastorName,
        pastorEmail: data.email,
        pastorPhone: data.pastorPhone,
        ...(data.congregationSize !== undefined && { congregationSize: data.congregationSize }),
        ...(data.yearEstablished !== undefined && { yearEstablished: data.yearEstablished }),
        doctrinalFlags: data.doctrinalFlags,
        status: 'PENDING',
      },
    });

    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: UserRole.PASTOR,
        churchId: church.id,
      },
    });

    return { user, church };
  });

  // Notify admin of new church application
  logger.info(`New church registration: ${data.churchName} (${data.email})`);

  return { userId: result.user.id, churchId: result.church.id };
}

// ─── Login ────────────────────────────────────────────────────
export async function login(data: LoginInput, ip: string): Promise<{
  requiresMfa: boolean;
  tempToken?: string;
  tokens?: AuthTokens;
}> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { church: { select: { status: true, pastorPhone: true } } },
  });

  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Check account lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new AppError(
      423,
      'ACCOUNT_LOCKED',
      `Account is locked. Try again in ${minutesLeft} minute(s) or use the unlock link sent to your email.`,
    );
  }

  const passwordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordValid) {
    const attempts = user.failedLoginAttempts + 1;

    if (attempts >= env.MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + env.ACCOUNT_LOCKOUT_MINUTES * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockedUntil },
      });
      // Send SMS if phone available
      sendSMS(user.church?.pastorPhone ?? '', SMSTemplates.accountLocked());
      throw new AppError(423, 'ACCOUNT_LOCKED', 'Account locked after too many failed attempts');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: attempts },
    });

    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Reset failed attempts
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  // H-01: Reject login if the pastor's church is not APPROVED.
  // Super admins have no churchId — the null guard allows them through.
  if (user.churchId && user.church?.status !== 'APPROVED') {
    throw new AppError(
      403,
      'CHURCH_NOT_APPROVED',
      `Your church is not currently approved on this platform (status: ${user.church?.status ?? 'UNKNOWN'}). Please contact the platform administrator.`,
    );
  }

  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role as UserRole,
    churchId: user.churchId,
  };

  // MFA required
  if (user.mfaEnabled) {
    const tempToken = generateSecureToken(32);
    await redis.setex(
      RedisKeys.mfaTempToken(tempToken),
      RedisTTL.MFA_TEMP,
      JSON.stringify(payload),
    );
    return { requiresMfa: true, tempToken };
  }

  // Issue tokens
  const accessToken = signAccessToken(payload);
  const refreshToken = await issueRefreshToken(user.id);

  logger.info(`Login: ${user.email} from ${ip}`);

  return {
    requiresMfa: false,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_ACCESS_TTL,
    },
  };
}

// ─── MFA Setup ────────────────────────────────────────────────
export async function setupMfa(userId: string): Promise<MfaSetupResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

  const secret = speakeasy.generateSecret({
    name: `OneFlesh (${user.email})`,
    issuer: 'OneFlesh',
    length: 20,
  });

  const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url ?? '');
  const backupCodes = Array.from({ length: 8 }, () => generateSecureToken(6).toUpperCase().slice(0, 8));

  // Store temp secret — not enabled until confirmed
  await prisma.user.update({
    where: { id: userId },
    data: { mfaSecret: secret.base32 },
  });

  return {
    secret: secret.base32,
    qrCodeDataUrl,
    backupCodes,
  };
}

// ─── MFA Enable ───────────────────────────────────────────────
export async function enableMfa(userId: string, data: MfaEnableInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.mfaSecret) {
    throw new AppError(400, 'MFA_NOT_SETUP', 'MFA setup not initiated');
  }

  const valid = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: data.code,
    window: 1,
  });

  if (!valid) {
    throw new AppError(400, 'INVALID_OTP', 'Invalid TOTP code');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true },
  });
}

// ─── MFA Verify ───────────────────────────────────────────────
export async function verifyMfa(data: MfaVerifyInput): Promise<AuthTokens> {
  const payloadStr = await redis.get(RedisKeys.mfaTempToken(data.tempToken));
  if (!payloadStr) {
    throw new AppError(401, 'MFA_TOKEN_EXPIRED', 'MFA session has expired. Please log in again.');
  }

  const payload = JSON.parse(payloadStr) as Omit<JwtPayload, 'iat' | 'exp'>;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user?.mfaSecret) throw new AppError(400, 'MFA_NOT_CONFIGURED', 'MFA is not configured');

  const valid = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token: data.code,
    window: 1,
  });

  if (!valid) {
    throw new AppError(401, 'INVALID_OTP', 'Invalid OTP code');
  }

  await redis.del(RedisKeys.mfaTempToken(data.tempToken));

  const accessToken = signAccessToken(payload);
  const refreshToken = await issueRefreshToken(user.id);

  return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_TTL };
}

// ─── Refresh ──────────────────────────────────────────────────
export async function refreshTokens(cookieToken: string): Promise<AuthTokens> {
  // H-03: Token format is "${userId}.${sessionId}.${token}"
  // userId = CUID (no dots), sessionId = UUID (dashes only), token = hex (no dots)
  // → splitting on the first two dots gives exactly three segments.
  const firstDot = cookieToken.indexOf('.');
  const secondDot = cookieToken.indexOf('.', firstDot + 1);

  if (firstDot === -1 || secondDot === -1) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token format');
  }

  const userId = cookieToken.slice(0, firstDot);
  const sessionId = cookieToken.slice(firstDot + 1, secondDot);
  const token = cookieToken.slice(secondDot + 1);

  if (!userId || !sessionId || !token) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  // H-03: O(1) direct key lookup — no keyspace scan
  const key = RedisKeys.refreshToken(userId, sessionId);
  const storedHash = await redis.get(key);

  if (!storedHash) {
    throw new AppError(401, 'REFRESH_TOKEN_EXPIRED', 'Session expired. Please log in again.');
  }

  if (hashToken(token) !== storedHash) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(401, 'USER_NOT_FOUND', 'User not found');

  // Rotate: delete consumed token + session entry, issue fresh pair
  await redis.del(key);
  await redis.zrem(RedisKeys.userSessions(userId), sessionId);

  const newRefreshToken = await issueRefreshToken(userId);
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role as UserRole,
    churchId: user.churchId,
  };
  const accessToken = signAccessToken(payload);

  return { accessToken, refreshToken: newRefreshToken, expiresIn: env.JWT_ACCESS_TTL };
}

// ─── Logout ───────────────────────────────────────────────────
export async function logout(userId: string, sessionToken: string, jti?: string): Promise<void> {
  // Token format: "${userId}.${sessionId}.${token}" — sessionId is at index 1
  const parts = sessionToken.split('.');
  const sessionId = parts.length >= 3 ? parts[1] : parts[0]; // graceful fallback for any legacy tokens
  if (sessionId) {
    await redis.del(RedisKeys.refreshToken(userId, sessionId));
    await redis.zrem(RedisKeys.userSessions(userId), sessionId);
  }

  // Blacklist access token
  if (jti) {
    await redis.setex(RedisKeys.tokenBlacklist(jti), RedisTTL.TOKEN_BLACKLIST, '1');
  }
}

// ─── Forgot password ──────────────────────────────────────────
export async function forgotPassword(data: ForgotPasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  // Always return success (don't reveal if email exists)
  if (!user) return;

  const token = generateSecureToken(32);
  const hashedToken = hashToken(token);

  await redis.setex(
    RedisKeys.passwordReset(hashedToken),
    RedisTTL.PASSWORD_RESET,
    user.id,
  );

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset Your Password — OneFlesh',
    html: EmailTemplates.passwordReset(resetUrl),
  });
}

// ─── Reset password ───────────────────────────────────────────
export async function resetPassword(data: ResetPasswordInput): Promise<void> {
  const hashedToken = hashToken(data.token);
  const userId = await redis.get(RedisKeys.passwordReset(hashedToken));

  if (!userId) {
    throw new AppError(400, 'INVALID_RESET_TOKEN', 'Password reset link is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: new Date(),
    },
  });

  await redis.del(RedisKeys.passwordReset(hashedToken));

  // Invalidate all existing sessions (sorted set → zrange)
  const sessions = await redis.zrange(RedisKeys.userSessions(userId), 0, -1);
  for (const sessionId of sessions) {
    await redis.del(RedisKeys.refreshToken(userId, sessionId));
  }
  await redis.del(RedisKeys.userSessions(userId));
}

// ─── List sessions ────────────────────────────────────────────
export async function listSessions(userId: string): Promise<string[]> {
  // zrange returns members sorted by score (insertion timestamp) ascending
  return redis.zrange(RedisKeys.userSessions(userId), 0, -1);
}

// ─── Revoke session ───────────────────────────────────────────
export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  await redis.del(RedisKeys.refreshToken(userId, sessionId));
  await redis.zrem(RedisKeys.userSessions(userId), sessionId);
}
