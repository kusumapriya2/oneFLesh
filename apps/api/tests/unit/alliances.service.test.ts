// ============================================================
// OneFlesh — Alliances Service Unit Tests
// Covers: C-04 (No church scope on direct access),
//         H-06 (Alliance creation no church membership check)
//
// ⚠️  tests document bugs that FAIL before the fix is applied.
// ============================================================

jest.mock('../../src/config/database.js', () => ({
  prisma: {
    alliance: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    allianceNote: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../src/config/redis.js', () => ({
  redis: { setex: jest.fn(), get: jest.fn(), del: jest.fn() },
  RedisKeys: {},
  RedisTTL: {},
}));

jest.mock('../../src/config/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../src/socket/index.js', () => ({ emitToUser: jest.fn() }));

jest.mock('../../src/modules/notifications/notifications.service.js', () => ({
  notifyNewInterest: jest.fn().mockResolvedValue(undefined),
  notifyAllianceAdvanced: jest.fn().mockResolvedValue(undefined),
}));

// ─── Imports ─────────────────────────────────────────────────

import { prisma } from '../../src/config/database.js';
import { AppError } from '../../src/middleware/errorHandler.js';
import * as alliancesService from '../../src/modules/alliances/alliances.service.js';

const mockPrismaAlliance = prisma.alliance as jest.Mocked<typeof prisma.alliance>;
const mockPrismaAllianceNote = prisma.allianceNote as jest.Mocked<typeof prisma.allianceNote>;
const mockPrismaProfile = prisma.profile as jest.Mocked<typeof prisma.profile>;
const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;

// ─── Fixtures ─────────────────────────────────────────────────

const ALLIANCE = {
  id: 'alliance-1',
  profile1Id: 'profile-1',
  profile2Id: 'profile-2',
  church1Id: 'church-A',  // Grace Church
  church2Id: 'church-B',  // Hope Church
  stage: 2,
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  openedAt: new Date(),
  dissolvedAt: null,
  dissolvedReason: null,
};

// Profile belonging to Grace Church
const PROFILE_GRACE = {
  id: 'profile-1',
  churchId: 'church-A',
  pastorId: 'pastor-A',
  status: 'APPROVED',
  deletedAt: null,
};

// Profile belonging to Hope Church
const PROFILE_HOPE = {
  id: 'profile-2',
  churchId: 'church-B',
  pastorId: 'pastor-B',
  status: 'APPROVED',
  deletedAt: null,
};

// Profile belonging to Trinity Church (unrelated third church)
const PROFILE_TRINITY = {
  id: 'profile-3',
  churchId: 'church-C',
  pastorId: 'pastor-C',
  status: 'APPROVED',
  deletedAt: null,
};

// ─── C-04: Alliance Direct Access Has No Church Scope ─────────

describe('C-04 · getAlliance — cross-church access control', () => {
  beforeEach(() => jest.clearAllMocks());

  it('⚠️  FAILS BEFORE FIX — should forbid access to alliance from unrelated church', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue({
      ...ALLIANCE,
      profile1: PROFILE_GRACE,
      profile2: PROFILE_HOPE,
      church1: { id: 'church-A', name: 'Grace Church' },
      church2: { id: 'church-B', name: 'Hope Church' },
      notes: [],
    } as never);

    // Pastor from Trinity Church (church-C) should NOT be able to access this alliance
    const requestingPastor = { sub: 'pastor-C', churchId: 'church-C', role: 'PASTOR' };

    // After the fix: this should throw AppError(403, 'FORBIDDEN')
    await expect(
      alliancesService.getAlliance('alliance-1', requestingPastor as never),
    ).rejects.toThrow(AppError);
  });

  it('⚠️  FAILS BEFORE FIX — should forbid reading notes of an unrelated alliance', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue(ALLIANCE as never);
    mockPrismaAllianceNote.findMany.mockResolvedValue([] as never);

    // After fix: should throw 403 for pastor from church-C
    await expect(
      alliancesService.getNotes('alliance-1', { sub: 'pastor-C', churchId: 'church-C', role: 'PASTOR' } as never),
    ).rejects.toThrow(AppError);
  });

  it('⚠️  FAILS BEFORE FIX — should forbid adding notes to an unrelated alliance', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue(ALLIANCE as never);

    // After fix: pastor from church-C should not be able to add notes to a church-A/church-B alliance
    await expect(
      alliancesService.addNote('alliance-1', 'pastor-C', 'Unauthorized observation'),
    ).rejects.toThrow(AppError);
  });

  it('⚠️  FAILS BEFORE FIX — should forbid advancing an alliance from unrelated church', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue({
      ...ALLIANCE,
      counsellingSessions: [],
    } as never);
    (prisma.$transaction as jest.Mock).mockResolvedValue({ ...ALLIANCE, stage: 3 });

    await expect(
      alliancesService.advanceAlliance(
        'alliance-1',
        { note: 'advancing' },
        'pastor-C', // unrelated pastor
      ),
    ).rejects.toThrow(AppError);
  });

  it('✅ allows a SUPER_ADMIN to access any alliance', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue({
      ...ALLIANCE,
      profile1: PROFILE_GRACE,
      profile2: PROFILE_HOPE,
      church1: { id: 'church-A', name: 'Grace Church' },
      church2: { id: 'church-B', name: 'Hope Church' },
      notes: [],
    } as never);

    // SUPER_ADMIN should bypass all church scope checks
    const admin = { sub: 'admin-1', churchId: null, role: 'SUPER_ADMIN' };
    await expect(
      alliancesService.getAlliance('alliance-1', admin as never),
    ).resolves.toBeDefined();
  });

  it('✅ allows church1 pastor to access alliance', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue({
      ...ALLIANCE,
      profile1: PROFILE_GRACE,
      profile2: PROFILE_HOPE,
      church1: { id: 'church-A', name: 'Grace Church' },
      church2: { id: 'church-B', name: 'Hope Church' },
      notes: [],
    } as never);

    // Pastor from Grace Church (church-A) should have access
    const pastor = { sub: 'pastor-A', churchId: 'church-A', role: 'PASTOR' };
    await expect(
      alliancesService.getAlliance('alliance-1', pastor as never),
    ).resolves.toBeDefined();
  });
});

// ─── H-06: Alliance Creation No Church Membership Check ───────

describe('H-06 · createAlliance — church membership enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaAlliance.findFirst.mockResolvedValue(null); // No existing alliance
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: (tx: unknown) => unknown) => {
      const tx = {
        alliance: { create: jest.fn().mockResolvedValue({ ...ALLIANCE, id: 'new-alliance' }) },
        allianceNote: { create: jest.fn() },
      };
      return cb(tx);
    });
  });

  it('⚠️  FAILS BEFORE FIX — should forbid creating alliance when creating pastor has no church involvement', async () => {
    // Profile 1 belongs to Grace Church
    // Profile 2 belongs to Hope Church
    // Requesting pastor is from Trinity Church (unrelated)
    mockPrismaProfile.findUnique
      .mockResolvedValueOnce(PROFILE_GRACE as never)
      .mockResolvedValueOnce(PROFILE_HOPE as never);

    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'pastor-C',
      churchId: 'church-C', // Trinity Church — not involved with either profile
      role: 'PASTOR',
    } as never);

    await expect(
      alliancesService.createAlliance(
        { profile1Id: 'profile-1', profile2Id: 'profile-2' },
        'pastor-C', // unrelated pastor
      ),
    ).rejects.toThrow(AppError);
  });

  it('✅ allows creating alliance when creating pastor belongs to church1', async () => {
    mockPrismaProfile.findUnique
      .mockResolvedValueOnce(PROFILE_GRACE as never)  // pastorId: pastor-A
      .mockResolvedValueOnce(PROFILE_HOPE as never);

    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'pastor-A',
      churchId: 'church-A', // Grace Church — matches profile1
    } as never);

    await expect(
      alliancesService.createAlliance(
        { profile1Id: 'profile-1', profile2Id: 'profile-2' },
        'pastor-A',
      ),
    ).resolves.toBeDefined();
  });

  it('✅ rejects when profile1 is not approved', async () => {
    mockPrismaProfile.findUnique.mockResolvedValueOnce({
      ...PROFILE_GRACE,
      status: 'PENDING',
    } as never);

    await expect(
      alliancesService.createAlliance(
        { profile1Id: 'profile-1', profile2Id: 'profile-2' },
        'pastor-A',
      ),
    ).rejects.toThrow(AppError);
  });

  it('✅ rejects duplicate active alliance between same profiles', async () => {
    mockPrismaProfile.findUnique
      .mockResolvedValueOnce(PROFILE_GRACE as never)
      .mockResolvedValueOnce(PROFILE_HOPE as never);
    mockPrismaAlliance.findFirst.mockResolvedValue(ALLIANCE as never); // existing

    await expect(
      alliancesService.createAlliance(
        { profile1Id: 'profile-1', profile2Id: 'profile-2' },
        'pastor-A',
      ),
    ).rejects.toThrow(AppError);
  });

  it('✅ rejects alliance between same profile', async () => {
    mockPrismaProfile.findUnique
      .mockResolvedValueOnce(PROFILE_GRACE as never)
      .mockResolvedValueOnce(PROFILE_GRACE as never);

    await expect(
      alliancesService.createAlliance(
        { profile1Id: 'profile-1', profile2Id: 'profile-1' },
        'pastor-A',
      ),
    ).rejects.toThrow(AppError);
  });
});

// ─── advanceAlliance: stage gate logic ────────────────────────

describe('advanceAlliance — stage gate validation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('✅ requires at least 1 counselling session before stage 4', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue({
      ...ALLIANCE,
      stage: 3,
      counsellingSessions: [], // no sessions yet
    } as never);

    await expect(
      alliancesService.advanceAlliance('alliance-1', { note: 'advance' }, 'pastor-A'),
    ).rejects.toThrow(AppError);
  });

  it('✅ requires 6 completed sessions before engagement (stage 5)', async () => {
    const incompleteSessions = Array.from({ length: 4 }, (_, i) => ({
      id: `session-${i}`,
      status: 'COMPLETED',
    }));
    mockPrismaAlliance.findUnique.mockResolvedValue({
      ...ALLIANCE,
      stage: 4,
      counsellingSessions: incompleteSessions,
    } as never);

    await expect(
      alliancesService.advanceAlliance('alliance-1', { note: 'engage' }, 'pastor-A'),
    ).rejects.toThrow(AppError);
  });

  it('✅ rejects advancing beyond stage 5', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue({
      ...ALLIANCE,
      stage: 5, // already at max
      counsellingSessions: [],
    } as never);

    await expect(
      alliancesService.advanceAlliance('alliance-1', { note: 'beyond max' }, 'pastor-A'),
    ).rejects.toThrow(AppError);
  });
});
