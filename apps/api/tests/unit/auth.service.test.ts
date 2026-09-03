// ============================================================
// OneFlesh — Auth Service Unit Tests
// Covers: C-01 (MFA backup codes), H-01 (church status check),
//         H-02 (MAX_CONCURRENT_SESSIONS), H-03 (Redis O(N) scan)
//
// Tests marked ⚠️  FAILS BEFORE FIX document known bugs.
// They will PASS once the corresponding fix is applied.
// ============================================================

// ── Mock all external dependencies before imports ────────────

jest.mock('../../src/config/database.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    church: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: unknown) => unknown) => {
      const tx = {
        church: { create: jest.fn() },
        user: { create: jest.fn() },
      };
      return Promise.resolve(cb(tx));
    }),
  },
}));

jest.mock('../../src/config/redis.js', () => ({
  redis: {
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    sadd: jest.fn().mockResolvedValue(1),
    scard: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    srem: jest.fn().mockResolvedValue(1),
    set: jest.fn().mockResolvedValue('OK'),
  },
  RedisKeys: {
    refreshToken: jest.fn((userId: string, sessionId: string) => `rt:${userId}:${sessionId}`),
    tokenBlacklist: jest.fn((jti: string) => `blacklist:${jti}`),
    userSessions: jest.fn((userId: string) => `sessions:${userId}`),
    mfaTempToken: jest.fn((token: string) => `mfa:temp:${token}`),
    passwordReset: jest.fn((token: string) => `pwd:reset:${token}`),
    loginAttempts: jest.fn((email: string) => `login:attempts:${email}`),
    accountLock: jest.fn((email: string) => `login:lock:${email}`),
  },
  RedisTTL: {
    REFRESH_TOKEN: 604800,
    MFA_TEMP: 300,
    PASSWORD_RESET: 900,
    TOKEN_BLACKLIST: 86400,
  },
}));

jest.mock('../../src/config/jwt.js', () => ({
  getJwtKeys: jest.fn(() => ({
    privateKey: 'mock-private-key',
    publicKey: 'mock-public-key',
  })),
}));

jest.mock('../../src/config/env.js', () => ({
  env: {
    BCRYPT_ROUNDS: 10,
    JWT_ACCESS_TTL: 900,
    JWT_REFRESH_TTL: 604800,
    MAX_LOGIN_ATTEMPTS: 5,
    ACCOUNT_LOCKOUT_MINUTES: 30,
    MAX_CONCURRENT_SESSIONS: 3,
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:5173',
  },
}));

jest.mock('../../src/config/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$mockedHash'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
}));

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({
    base32: 'JBSWY3DPEHPK3PXP',
    otpauth_url: 'otpauth://totp/OneFlesh:test@example.com?secret=JBSWY3DPEHPK3PXP',
  }),
  totp: { verify: jest.fn().mockReturnValue(true) },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqrcode'),
}));

jest.mock('uuid', () => ({ v4: jest.fn().mockReturnValue('test-uuid-v4') }));

jest.mock('../../src/utils/crypto.js', () => ({
  generateSecureToken: jest.fn().mockReturnValue('mock-secure-token'),
  hashToken: jest.fn((t: string) => `hashed:${t}`),
  encrypt: jest.fn((s: string) => `encrypted:${s}`),
  decrypt: jest.fn((s: string) => s.replace('encrypted:', '')),
}));

jest.mock('../../src/utils/email.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  EmailTemplates: {
    passwordReset: jest.fn().mockReturnValue('<html>reset</html>'),
    newInterest: jest.fn(),
    allianceAdvanced: jest.fn(),
  },
}));

jest.mock('../../src/utils/sms.js', () => ({
  sendSMS: jest.fn().mockResolvedValue(undefined),
  SMSTemplates: { accountLocked: jest.fn().mockReturnValue('Your account is locked') },
}));

// ── Imports after mocks ──────────────────────────────────────

import { prisma } from '../../src/config/database.js';
import { redis } from '../../src/config/redis.js';
import { AppError } from '../../src/middleware/errorHandler.js';
import * as authService from '../../src/modules/auth/auth.service.js';

// ── Typed mock helpers ───────────────────────────────────────

const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;
const mockRedis = redis as jest.Mocked<typeof redis>;

// ─── Shared test fixtures ─────────────────────────────────────

const APPROVED_USER = {
  id: 'user-1',
  email: 'pastor@grace.in',
  passwordHash: '$2b$10$mockedHash',
  role: 'PASTOR',
  churchId: 'church-1',
  mfaEnabled: false,
  mfaSecret: null,
  mfaBackupCodes: [],
  failedLoginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  deletedAt: null,
  church: { status: 'APPROVED' },
};

const SUSPENDED_USER = {
  ...APPROVED_USER,
  id: 'user-suspended',
  church: { status: 'SUSPENDED' },
};

const PENDING_CHURCH_USER = {
  ...APPROVED_USER,
  id: 'user-pending',
  church: { status: 'PENDING' },
};

// ─── C-01: MFA Backup Codes Never Saved ──────────────────────

describe('C-01 · setupMfa — MFA backup codes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaUser.findUnique.mockResolvedValue(APPROVED_USER as never);
    mockPrismaUser.update.mockResolvedValue({ ...APPROVED_USER, mfaSecret: 'encrypted:JBSWY3DPEHPK3PXP' } as never);
  });

  it('⚠️  FAILS BEFORE FIX — should persist mfaBackupCodes to the database', async () => {
    // This test documents the bug: backup codes are returned to the client
    // but never saved in prisma.user.update(), so they cannot be used for recovery.
    await authService.setupMfa('user-1');

    expect(mockPrismaUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mfaBackupCodes: expect.any(Array),
        }),
      }),
    );
  });

  it('⚠️  FAILS BEFORE FIX — saved backup codes should be hashed, not plaintext', async () => {
    await authService.setupMfa('user-1');

    const updateCall = mockPrismaUser.update.mock.calls[0];
    const updateData = (updateCall?.[0] as { data: Record<string, unknown> })?.data;

    expect(updateData).toBeDefined();
    const backupCodes = updateData?.['mfaBackupCodes'] as string[] | undefined;
    expect(backupCodes).toBeDefined();

    // Codes should be hashed (not raw) — the plaintext goes to client, hash to DB
    expect(backupCodes?.every((c: string) => c.startsWith('hashed:'))).toBe(true);
  });

  it('returns 8 backup codes to the client', async () => {
    const result = await authService.setupMfa('user-1');
    // backupCodes are returned to the user (they should also be saved — see above)
    expect(result.backupCodes).toHaveLength(8);
  });

  it('returns a QR code data URL', async () => {
    const result = await authService.setupMfa('user-1');
    expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('always saves mfaSecret to DB', async () => {
    await authService.setupMfa('user-1');
    expect(mockPrismaUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mfaSecret: expect.any(String),
        }),
      }),
    );
  });
});

// ─── C-01b: verifyMfa has no backup code path ─────────────────

describe('C-01b · verifyMfa — backup code recovery path', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(
      JSON.stringify({
        sub: 'user-1',
        email: 'pastor@grace.in',
        role: 'PASTOR',
        churchId: 'church-1',
      }),
    );
    mockPrismaUser.findUnique.mockResolvedValue({
      ...APPROVED_USER,
      mfaEnabled: true,
      mfaSecret: 'encrypted:JBSWY3DPEHPK3PXP',
      mfaBackupCodes: ['hashed:BACKUP01', 'hashed:BACKUP02'],
    } as never);
  });

  it('⚠️  FAILS BEFORE FIX — should accept a valid backup code instead of TOTP', async () => {
    // Simulate TOTP failing (wrong code) but backup code is valid
    const speakeasy = await import('speakeasy');
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

    // With backup code 'BACKUP01' (hashed as 'hashed:BACKUP01' in mock)
    // The service should try backup codes when TOTP fails
    await expect(
      authService.verifyMfa({ tempToken: 'valid-temp-token', code: 'BACKUP01' }),
    ).resolves.toBeDefined(); // Should succeed with backup code
  });

  it('⚠️  FAILS BEFORE FIX — should invalidate (consume) a backup code after use', async () => {
    const speakeasy = await import('speakeasy');
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

    try {
      await authService.verifyMfa({ tempToken: 'valid-temp-token', code: 'BACKUP01' });
    } catch {
      // may fail due to bug — we still check if update was called
    }

    // After using a backup code, it should be removed from the array
    const updateCall = mockPrismaUser.update.mock.calls.find((call) => {
      const data = (call[0] as { data: Record<string, unknown> })?.data;
      return 'mfaBackupCodes' in (data ?? {});
    });

    // This assertion catches the bug: no update to backup codes happens currently
    expect(updateCall).toBeDefined();
  });

  it('rejects an invalid TOTP code with no backup code fallback', async () => {
    const speakeasy = await import('speakeasy');
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
    // Current bug: throws INVALID_OTP even if backup code would be valid
    await expect(
      authService.verifyMfa({ tempToken: 'valid-temp-token', code: '000000' }),
    ).rejects.toThrow(AppError);
  });
});

// ─── H-01: Church Status Never Checked on Login ───────────────

describe('H-01 · login — church approval status check', () => {
  beforeEach(() => jest.clearAllMocks());

  it('⚠️  FAILS BEFORE FIX — should reject login from SUSPENDED church', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(SUSPENDED_USER as never);
    mockPrismaUser.update.mockResolvedValue(SUSPENDED_USER as never);

    await expect(
      authService.login({ email: 'pastor@suspended.in', password: 'Valid@Pass123' }, '127.0.0.1'),
    ).rejects.toThrow(AppError);

    // Verify the specific error is about church not being approved
    try {
      await authService.login({ email: 'pastor@suspended.in', password: 'Valid@Pass123' }, '127.0.0.1');
    } catch (err) {
      expect((err as AppError).code).toBe('CHURCH_NOT_APPROVED');
    }
  });

  it('⚠️  FAILS BEFORE FIX — should reject login from PENDING church', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(PENDING_CHURCH_USER as never);
    mockPrismaUser.update.mockResolvedValue(PENDING_CHURCH_USER as never);

    await expect(
      authService.login({ email: 'pastor@pending.in', password: 'Valid@Pass123' }, '127.0.0.1'),
    ).rejects.toThrow(AppError);
  });

  it('✅ should allow login from an APPROVED church', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(APPROVED_USER as never);
    mockPrismaUser.update.mockResolvedValue(APPROVED_USER as never);
    mockRedis.setex.mockResolvedValue('OK');
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.scard.mockResolvedValue(1);

    const result = await authService.login(
      { email: 'pastor@grace.in', password: 'Valid@Pass123' },
      '127.0.0.1',
    );
    expect(result.requiresMfa).toBe(false);
    expect(result.tokens?.accessToken).toBeDefined();
  });

  it('✅ should reject login for non-existent user', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'unknown@nobody.com', password: 'Any@Pass123' }, '127.0.0.1'),
    ).rejects.toThrow(AppError);
  });

  it('✅ should reject login with wrong password', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(APPROVED_USER as never);
    mockPrismaUser.update.mockResolvedValue(APPROVED_USER as never);
    const bcrypt = await import('bcrypt');
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.login({ email: 'pastor@grace.in', password: 'Wrong@Pass!' }, '127.0.0.1'),
    ).rejects.toThrow(AppError);
  });

  it('✅ should lock account after MAX_LOGIN_ATTEMPTS failed attempts', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      ...APPROVED_USER,
      failedLoginAttempts: 4, // one away from lockout
    } as never);
    mockPrismaUser.update.mockResolvedValue({ ...APPROVED_USER, lockedUntil: new Date() } as never);
    const bcrypt = await import('bcrypt');
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      authService.login({ email: 'pastor@grace.in', password: 'Wrong@Pass!' }, '127.0.0.1'),
    ).rejects.toThrow(AppError);
  });

  it('✅ should return MFA temp token when MFA is enabled', async () => {
    const mfaUser = { ...APPROVED_USER, mfaEnabled: true, mfaSecret: 'encrypted:SECRET' };
    mockPrismaUser.findUnique.mockResolvedValue(mfaUser as never);
    mockPrismaUser.update.mockResolvedValue(mfaUser as never);
    mockRedis.setex.mockResolvedValue('OK');

    const result = await authService.login(
      { email: 'pastor@grace.in', password: 'Valid@Pass123' },
      '127.0.0.1',
    );
    expect(result.requiresMfa).toBe(true);
    expect(result.tempToken).toBeDefined();
    expect(result.tokens).toBeUndefined();
  });
});

// ─── H-02: MAX_CONCURRENT_SESSIONS Never Enforced ─────────────

describe('H-02 · issueRefreshToken — MAX_CONCURRENT_SESSIONS', () => {
  beforeEach(() => jest.clearAllMocks());

  it('⚠️  FAILS BEFORE FIX — should check redis.scard when issuing a new session', async () => {
    // Force a successful login to trigger issueRefreshToken internally
    mockPrismaUser.findUnique.mockResolvedValue(APPROVED_USER as never);
    mockPrismaUser.update.mockResolvedValue(APPROVED_USER as never);
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.scard.mockResolvedValue(1);
    mockRedis.setex.mockResolvedValue('OK');

    await authService.login({ email: 'pastor@grace.in', password: 'Valid@Pass123' }, '127.0.0.1');

    // After fix: scard MUST be called to check the session count
    expect(mockRedis.scard).toHaveBeenCalled();
  });

  it('⚠️  FAILS BEFORE FIX — should evict oldest session when limit exceeded', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(APPROVED_USER as never);
    mockPrismaUser.update.mockResolvedValue(APPROVED_USER as never);
    // Simulate 3 sessions already active (at limit of MAX_CONCURRENT_SESSIONS=3)
    mockRedis.scard.mockResolvedValue(4); // over limit after adding new one
    mockRedis.smembers.mockResolvedValue(['old-session-1', 'old-session-2', 'old-session-3']);
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.setex.mockResolvedValue('OK');

    await authService.login({ email: 'pastor@grace.in', password: 'Valid@Pass123' }, '127.0.0.1');

    // After fix: srem should be called to remove the oldest session
    expect(mockRedis.srem).toHaveBeenCalled();
  });

  it('✅ tracks sessions in Redis on each login (sadd is called)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(APPROVED_USER as never);
    mockPrismaUser.update.mockResolvedValue(APPROVED_USER as never);
    mockRedis.setex.mockResolvedValue('OK');
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.scard.mockResolvedValue(1);

    await authService.login({ email: 'pastor@grace.in', password: 'Valid@Pass123' }, '127.0.0.1');

    expect(mockRedis.sadd).toHaveBeenCalledWith(
      expect.stringMatching(/^sessions:/),
      expect.any(String),
    );
  });
});

// ─── H-03: O(N) Redis Key Scan in refreshTokens ──────────────

describe('H-03 · refreshTokens — Redis O(N) key scan', () => {
  const SESSION_ID = 'session-abc123';
  const TOKEN = 'random-token-value';
  const USER_ID = 'user-1';
  const COOKIE_TOKEN = `${SESSION_ID}.${TOKEN}`;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup a valid stored token
    mockRedis.keys.mockResolvedValue([`rt:${USER_ID}:${SESSION_ID}`]);
    mockRedis.get.mockResolvedValue('hashed:random-token-value');
    mockRedis.del.mockResolvedValue(1);
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.scard.mockResolvedValue(1);
    mockRedis.setex.mockResolvedValue('OK');
    mockPrismaUser.findUnique.mockResolvedValue(APPROVED_USER as never);
    mockPrismaUser.update.mockResolvedValue(APPROVED_USER as never);
  });

  it('⚠️  FAILS BEFORE FIX — should NOT use redis.keys() (O(N) blocking scan)', async () => {
    // redis.keys() is an anti-pattern: it scans all keys and blocks Redis.
    // The session ID and user ID are both encoded in the token — build the key directly.
    try {
      await authService.refreshTokens(COOKIE_TOKEN);
    } catch {
      // Token may fail due to hash mismatch in mock — we only care about keys() not being called
    }
    expect(mockRedis.keys).not.toHaveBeenCalled();
  });

  it('⚠️  FAILS BEFORE FIX — should construct refresh token key directly (O(1) lookup)', async () => {
    // The refresh token format is `{sessionId}.{token}`, and the key is `rt:{userId}:{sessionId}`.
    // Since the token payload contains userId, the key can be built directly without scanning.
    // After fix: redis.get should be called with the exact key, not via redis.keys()
    try {
      await authService.refreshTokens(COOKIE_TOKEN);
    } catch {
      // ignore errors from mock setup
    }

    const getCalls = mockRedis.get.mock.calls.map((c) => c[0]);
    // After fix: a direct get with the full key should be called
    const directKeyLookup = getCalls.some((key) =>
      typeof key === 'string' && key.startsWith('rt:'),
    );
    expect(directKeyLookup).toBe(true);
  });

  it('✅ rotates refresh token on valid refresh (deletes old, issues new)', async () => {
    await authService.refreshTokens(COOKIE_TOKEN);

    expect(mockRedis.del).toHaveBeenCalledWith(
      expect.stringMatching(/^rt:/),
    );
    // New token stored via setex
    expect(mockRedis.setex).toHaveBeenCalledWith(
      expect.stringMatching(/^rt:/),
      expect.any(Number),
      expect.any(String),
    );
  });

  it('✅ throws on missing/expired session', async () => {
    mockRedis.keys.mockResolvedValue([]);

    await expect(authService.refreshTokens(COOKIE_TOKEN)).rejects.toThrow(AppError);
  });
});

// ─── Logout: token blacklisting ──────────────────────────────

describe('logout — JTI blacklisting', () => {
  beforeEach(() => jest.clearAllMocks());

  it('✅ blacklists the access token JTI on logout', async () => {
    mockRedis.del.mockResolvedValue(1);
    mockRedis.srem.mockResolvedValue(1);
    mockRedis.setex.mockResolvedValue('OK');

    await authService.logout('user-1', 'session-abc.token-value', 'jti-uuid');

    expect(mockRedis.setex).toHaveBeenCalledWith(
      expect.stringMatching(/^blacklist:/),
      expect.any(Number),
      '1',
    );
  });

  it('✅ removes session from Redis set on logout', async () => {
    mockRedis.del.mockResolvedValue(1);
    mockRedis.srem.mockResolvedValue(1);

    await authService.logout('user-1', 'session-abc.token-value', 'jti-uuid');

    expect(mockRedis.srem).toHaveBeenCalledWith(
      'sessions:user-1',
      'session-abc',
    );
  });
});

// ─── forgotPassword: timing-safe response ────────────────────

describe('forgotPassword — email enumeration protection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('✅ returns success even when email does not exist (no enumeration)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);

    // Should not throw — must return silently
    await expect(authService.forgotPassword({ email: 'nobody@nowhere.com' })).resolves.toBeUndefined();
  });

  it('✅ stores hashed reset token in Redis (not plaintext)', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(APPROVED_USER as never);
    mockRedis.setex.mockResolvedValue('OK');

    await authService.forgotPassword({ email: 'pastor@grace.in' });

    const setexCalls = mockRedis.setex.mock.calls;
    const resetCall = setexCalls.find((c) => String(c[0]).startsWith('pwd:reset:'));
    expect(resetCall).toBeDefined();
    // Key should contain the hashed token, not the raw token
    expect(String(resetCall?.[0])).toMatch(/^pwd:reset:hashed:/);
  });
});
