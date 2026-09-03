// ============================================================
// OneFlesh — Counselling Service Unit Tests
// Covers: M-07 (registerCouple no church scope),
//         M-08 (getSession no scope),
//         + correct behaviours (completeSession ownership check)
// ============================================================

jest.mock('../../src/config/database.js', () => ({
  prisma: {
    alliance: { findUnique: jest.fn() },
    counsellingSession: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../src/config/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../src/modules/ai/ai.service.js', () => ({
  generateCounsellingQuestions: jest.fn().mockResolvedValue(['Q1?', 'Q2?']),
}));

// ─── Imports ─────────────────────────────────────────────────

import { prisma } from '../../src/config/database.js';
import { AppError } from '../../src/middleware/errorHandler.js';
import * as counsellingService from '../../src/modules/counselling/counselling.service.js';

const mockPrismaAlliance = prisma.alliance as jest.Mocked<typeof prisma.alliance>;
const mockPrismaSession = prisma.counsellingSession as jest.Mocked<typeof prisma.counsellingSession>;
const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;

// ─── Fixtures ─────────────────────────────────────────────────

const ALLIANCE = {
  id: 'alliance-1',
  stage: 4,
  status: 'ACTIVE',
  church1Id: 'church-A',
  church2Id: 'church-B',
  church1: { id: 'church-A', name: 'Grace Church' },
  church2: { id: 'church-B', name: 'Hope Church' },
};

const SESSION_6 = {
  id: 'session-6',
  allianceId: 'alliance-1',
  sessionNumber: 6,
  status: 'COMPLETED',
  groomName: 'Samuel',
  brideName: 'Ruth',
  groomChurch: 'Grace Church',
  brideChurch: 'Hope Church',
  counsellorName: 'Pastor John',
  completedAt: new Date(),
  alliance: ALLIANCE,
};

// ─── M-08: getSession Has No Church Scope ─────────────────────

describe('M-08 · getSession — access control', () => {
  beforeEach(() => jest.clearAllMocks());

  it('⚠️  FAILS BEFORE FIX — should forbid access to session from unrelated church', async () => {
    const session = {
      ...SESSION_6,
      alliance: {
        ...ALLIANCE,
        profile1: { id: 'p1', fullName: 'Samuel', seeking: 'BRIDE' },
        profile2: { id: 'p2', fullName: 'Ruth', seeking: 'GROOM' },
      },
    };
    mockPrismaSession.findUnique.mockResolvedValue(session as never);

    // Pastor from Trinity Church (church-C) should not see this session
    const unrelatedPastor = { sub: 'pastor-C', churchId: 'church-C', role: 'PASTOR' };
    await expect(
      counsellingService.getSession('session-6', unrelatedPastor as never),
    ).rejects.toThrow(AppError);
  });

  it('✅ allows church1 pastor to view their session', async () => {
    const session = {
      ...SESSION_6,
      alliance: { ...ALLIANCE, profile1: {}, profile2: {} },
    };
    mockPrismaSession.findUnique.mockResolvedValue(session as never);

    const pastor = { sub: 'pastor-A', churchId: 'church-A', role: 'PASTOR' };
    await expect(
      counsellingService.getSession('session-6', pastor as never),
    ).resolves.toBeDefined();
  });
});

// ─── M-07: registerCouple No Church Scope ─────────────────────

describe('M-07 · registerCouple — church membership check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaSession.count.mockResolvedValue(0);
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => unknown) => {
      const sessions = Array.from({ length: 6 }, (_, i) => ({
        id: `s-${i + 1}`,
        sessionNumber: i + 1,
        status: 'SCHEDULED',
        allianceId: 'alliance-1',
      }));
      const tx = {
        counsellingSession: { create: jest.fn().mockResolvedValueOnce(sessions[0]) },
      };
      return cb(tx);
    });
    mockPrismaSession.create.mockResolvedValue({ id: 'new-session' } as never);
  });

  it('⚠️  FAILS BEFORE FIX — should forbid registering sessions for unrelated alliance', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue(ALLIANCE as never);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'pastor-C',
      churchId: 'church-C', // Trinity Church — not party to this alliance
    } as never);

    await expect(
      counsellingService.registerCouple(
        {
          allianceId: 'alliance-1',
          groomName: 'Samuel',
          brideName: 'Ruth',
          groomChurch: 'Grace Church',
          brideChurch: 'Hope Church',
          counsellorName: 'Pastor John',
          format: 'IN_PERSON',
        },
        'pastor-C', // requesting pastor from unrelated church
      ),
    ).rejects.toThrow(AppError);
  });

  it('✅ allows church1 pastor to register counselling', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue(ALLIANCE as never);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'pastor-A',
      churchId: 'church-A', // Grace Church — is party to alliance
    } as never);
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      ...Array.from({ length: 6 }, (_, i) => ({ id: `s-${i + 1}`, sessionNumber: i + 1 })),
    ]);

    await expect(
      counsellingService.registerCouple(
        {
          allianceId: 'alliance-1',
          groomName: 'Samuel',
          brideName: 'Ruth',
          groomChurch: 'Grace Church',
          brideChurch: 'Hope Church',
          counsellorName: 'Pastor John',
          format: 'IN_PERSON',
        },
        'pastor-A',
      ),
    ).resolves.toBeDefined();
  });

  it('✅ rejects if alliance is below stage 3', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue({
      ...ALLIANCE,
      stage: 2,
    } as never);

    await expect(
      counsellingService.registerCouple(
        {
          allianceId: 'alliance-1',
          groomName: 'Samuel',
          brideName: 'Ruth',
          groomChurch: 'Grace Church',
          brideChurch: 'Hope Church',
          counsellorName: 'Pastor John',
          format: 'IN_PERSON',
        },
        'pastor-A',
      ),
    ).rejects.toThrow(AppError);
  });

  it('✅ rejects duplicate session registration', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue(ALLIANCE as never);
    mockPrismaSession.count.mockResolvedValue(6); // already registered

    await expect(
      counsellingService.registerCouple(
        {
          allianceId: 'alliance-1',
          groomName: 'Samuel',
          brideName: 'Ruth',
          groomChurch: 'Grace',
          brideChurch: 'Hope',
          counsellorName: 'Pastor',
          format: 'IN_PERSON',
        },
        'pastor-A',
      ),
    ).rejects.toThrow(AppError);
  });
});

// ─── completeSession: church ownership check ──────────────────

describe('completeSession — correct cross-church guard (already implemented)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('✅ forbids completing a session from an unrelated church (existing good behaviour)', async () => {
    mockPrismaSession.findUnique.mockResolvedValue({
      ...SESSION_6,
      status: 'SCHEDULED',
      alliance: ALLIANCE,
    } as never);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'pastor-C',
      churchId: 'church-C',
    } as never);

    await expect(
      counsellingService.completeSession('session-6', { notes: 'done' }, 'pastor-C'),
    ).rejects.toThrow(AppError);
  });

  it('✅ allows church1 pastor to complete a session', async () => {
    mockPrismaSession.findUnique.mockResolvedValue({
      ...SESSION_6,
      status: 'SCHEDULED',
      alliance: ALLIANCE,
    } as never);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'pastor-A',
      churchId: 'church-A',
    } as never);
    mockPrismaSession.update.mockResolvedValue({
      ...SESSION_6,
      status: 'COMPLETED',
    } as never);

    await expect(
      counsellingService.completeSession('session-6', { notes: 'done' }, 'pastor-A'),
    ).resolves.toBeDefined();
  });

  it('✅ rejects completing an already-completed session', async () => {
    mockPrismaSession.findUnique.mockResolvedValue({
      ...SESSION_6,
      status: 'COMPLETED', // already done
      alliance: ALLIANCE,
    } as never);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'pastor-A',
      churchId: 'church-A',
    } as never);

    await expect(
      counsellingService.completeSession('session-6', { notes: 'done' }, 'pastor-A'),
    ).rejects.toThrow(AppError);
  });
});
