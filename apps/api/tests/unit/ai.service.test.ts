// ============================================================
// OneFlesh — AI Service Unit Tests
// Covers: H-07 (generateAllianceSummary no church scope),
//         M-06 (chat allows assistant role injection)
// ============================================================

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'A pastoral summary of the alliance.' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
      stream: jest.fn().mockReturnValue({
        [Symbol.asyncIterator]: jest.fn().mockReturnValue({
          next: jest.fn().mockResolvedValue({ done: true }),
        }),
      }),
    },
  })),
}));

jest.mock('../../src/config/database.js', () => ({
  prisma: {
    alliance: { findUnique: jest.fn() },
    profile: { findUnique: jest.fn(), findMany: jest.fn() },
    user: { findUnique: jest.fn() },
    aIInteraction: { create: jest.fn() },
  },
}));

jest.mock('../../src/config/redis.js', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    incrby: jest.fn().mockResolvedValue(150),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  },
  RedisKeys: {
    aiResponseCache: (key: string) => `ai:cache:${key}`,
    aiDailyTokens: (date: string) => `ai:tokens:${date}`,
    aiDailyRequests: (userId: string, date: string) => `ai:req:${userId}:${date}`,
  },
  RedisTTL: { AI_RESPONSE_CACHE: 3600 },
}));

jest.mock('../../src/config/env.js', () => ({
  env: {
    ANTHROPIC_API_KEY: 'test-key',
    AI_DAILY_SPEND_LIMIT: 100,
    AI_DAILY_SPEND_ALERT: 80,
  },
}));

jest.mock('../../src/config/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../src/socket/index.js', () => ({
  emitToUser: jest.fn(),
}));

// ─── Imports ─────────────────────────────────────────────────

import { prisma } from '../../src/config/database.js';
import { AppError } from '../../src/middleware/errorHandler.js';
import * as aiService from '../../src/modules/ai/ai.service.js';

const mockPrismaAlliance = prisma.alliance as jest.Mocked<typeof prisma.alliance>;
const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;
const mockPrismaAIInteraction = prisma.aIInteraction as jest.Mocked<typeof prisma.aIInteraction>;

// ─── Fixtures ─────────────────────────────────────────────────

const ALLIANCE = {
  id: 'alliance-1',
  stage: 2,
  status: 'ACTIVE',
  church1Id: 'church-A',
  church2Id: 'church-B',
  profile1Id: 'profile-1',
  profile2Id: 'profile-2',
  profile1: { age: 26, city: 'Hyderabad', state: 'Telangana', seeking: 'BRIDE', ministryInvolvement: 'Youth', occupation: 'Engineer', yearsInChurch: 4 },
  profile2: { age: 25, city: 'Chennai', state: 'Tamil Nadu', seeking: 'GROOM', ministryInvolvement: 'Choir', occupation: 'Teacher', yearsInChurch: 6 },
  church1: { name: 'Grace Church', denomination: 'PCI', city: 'Hyderabad' },
  church2: { name: 'Hope Church', denomination: 'PCI', city: 'Chennai' },
  notes: [
    { content: 'Initial meeting was positive.', createdAt: new Date() },
  ],
};

// ─── H-07: generateAllianceSummary Has No Church Scope ────────

describe('H-07 · generateAllianceSummary — cross-church access control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaAIInteraction.create.mockResolvedValue({} as never);
  });

  it('⚠️  FAILS BEFORE FIX — should forbid summary for pastor from unrelated church', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue(ALLIANCE as never);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'pastor-C',
      churchId: 'church-C', // Trinity Church — not party to this alliance
    } as never);

    // Pastor from church-C should NOT be able to get a summary of a church-A/church-B alliance
    await expect(
      aiService.generateAllianceSummary({ allianceId: 'alliance-1' }, 'pastor-C'),
    ).rejects.toThrow(AppError);
  });

  it('✅ allows church1 pastor to get alliance summary', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue(ALLIANCE as never);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'pastor-A',
      churchId: 'church-A', // Grace Church — IS party to this alliance
    } as never);

    await expect(
      aiService.generateAllianceSummary({ allianceId: 'alliance-1' }, 'pastor-A'),
    ).resolves.toBeDefined();
  });

  it('✅ allows church2 pastor to get alliance summary', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue(ALLIANCE as never);
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'pastor-B',
      churchId: 'church-B', // Hope Church — IS party to this alliance
    } as never);

    await expect(
      aiService.generateAllianceSummary({ allianceId: 'alliance-1' }, 'pastor-B'),
    ).resolves.toBeDefined();
  });

  it('✅ throws 404 when alliance does not exist', async () => {
    mockPrismaAlliance.findUnique.mockResolvedValue(null as never);

    await expect(
      aiService.generateAllianceSummary({ allianceId: 'nonexistent' }, 'pastor-A'),
    ).rejects.toThrow(AppError);
  });
});

// ─── buildSystemPrompt: PII exclusion (existing correct behaviour) ─

describe('buildSystemPrompt — PII exclusion (correct behaviour)', () => {
  it('✅ omits fullName, fatherName, and photoUrl from system prompt', () => {
    const profiles = [
      {
        id: 'p1',
        age: 26,
        city: 'Hyderabad',
        state: 'Telangana',
        seeking: 'BRIDE',
        education: 'B.Tech',
        occupation: 'Engineer',
        ministryInvolvement: 'Youth',
        yearsInChurch: 4,
        fullName: 'Samuel Raju',    // PII — must NOT appear in prompt
        fatherName: 'John Raju',    // PII — must NOT appear in prompt
        photoUrl: 's3://profile-1', // PII — must NOT appear in prompt
      },
    ];

    const prompt = aiService.buildSystemPrompt(profiles, []);

    expect(prompt).not.toContain('Samuel Raju');
    expect(prompt).not.toContain('John Raju');
    expect(prompt).not.toContain('s3://profile-1');
    // Confirms that non-PII fields ARE included
    expect(prompt).toContain('Hyderabad');
  });
});
