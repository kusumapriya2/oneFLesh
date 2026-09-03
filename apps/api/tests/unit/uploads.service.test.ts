// ============================================================
// OneFlesh — Uploads Service Unit Tests
// Covers: H-05 (uploadProfilePhoto no ownership check)
// ============================================================

jest.mock('../../src/config/database.js', () => ({
  prisma: {
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vendor: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../src/config/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Mock Sharp — avoid real image processing in unit tests
jest.mock('sharp', () =>
  jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
  })),
);

// Mock AWS S3 client
jest.mock('../../src/config/aws.js', () => ({
  s3Client: { send: jest.fn().mockResolvedValue({}) },
  S3_BUCKET: 'oneflesh-test-bucket',
}));

// Mock S3 presigned URL generator
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/signed-url'),
}));

// Mock AWS SDK commands (they're instantiated but not called directly)
jest.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

// ─── Imports ─────────────────────────────────────────────────

import { prisma } from '../../src/config/database.js';
import { AppError } from '../../src/middleware/errorHandler.js';
import * as uploadsService from '../../src/modules/uploads/uploads.service.js';

const mockPrismaProfile = prisma.profile as jest.Mocked<typeof prisma.profile>;
const mockPrismaVendor = prisma.vendor as jest.Mocked<typeof prisma.vendor>;

// ─── Fixtures ─────────────────────────────────────────────────

const PROFILE_OWNED_BY_PASTOR_A = {
  id: 'profile-1',
  pastorId: 'pastor-A',
  churchId: 'church-A',
};

const SMALL_IMAGE_BUFFER = Buffer.from('fake-image-data');

// ─── H-05: Profile Photo Upload Has No Ownership Check ────────

describe('H-05 · uploadProfilePhoto — ownership enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaProfile.update.mockResolvedValue({ id: 'profile-1', photoUrl: 'profiles/profile-1/medium.jpg' } as never);
  });

  it('⚠️  FAILS BEFORE FIX — should forbid uploading photo for a profile not owned by the requesting pastor', async () => {
    // Profile belongs to pastor-A
    mockPrismaProfile.findUnique.mockResolvedValue(PROFILE_OWNED_BY_PASTOR_A as never);

    // pastor-B is trying to overwrite pastor-A's profile photo
    await expect(
      uploadsService.uploadProfilePhoto('profile-1', SMALL_IMAGE_BUFFER, 'image/jpeg', 'pastor-B'),
    ).rejects.toThrow(AppError);
  });

  it('✅ allows the owning pastor to upload their own profile photo', async () => {
    // Profile belongs to pastor-A and pastor-A is uploading
    mockPrismaProfile.findUnique.mockResolvedValue(PROFILE_OWNED_BY_PASTOR_A as never);

    await expect(
      uploadsService.uploadProfilePhoto('profile-1', SMALL_IMAGE_BUFFER, 'image/jpeg', 'pastor-A'),
    ).resolves.toMatchObject({
      thumbnailUrl: expect.any(String),
      mediumUrl: expect.any(String),
    });
  });

  it('✅ throws 404 when profile does not exist', async () => {
    mockPrismaProfile.findUnique.mockResolvedValue(null as never);

    await expect(
      uploadsService.uploadProfilePhoto('nonexistent', SMALL_IMAGE_BUFFER, 'image/jpeg', 'pastor-A'),
    ).rejects.toThrow(AppError);
  });

  it('✅ throws 415 for unsupported image type', async () => {
    mockPrismaProfile.findUnique.mockResolvedValue(PROFILE_OWNED_BY_PASTOR_A as never);

    await expect(
      uploadsService.uploadProfilePhoto('profile-1', SMALL_IMAGE_BUFFER, 'image/gif', 'pastor-A'),
    ).rejects.toThrow(AppError);
  });
});

// ─── Vendor photo upload: ownership check already works ───────

describe('uploadVendorPhoto — ownership already enforced', () => {
  beforeEach(() => jest.clearAllMocks());

  it('✅ throws 404 when vendor does not exist', async () => {
    mockPrismaVendor.findUnique.mockResolvedValue(null as never);

    await expect(
      uploadsService.uploadVendorPhoto('nonexistent', SMALL_IMAGE_BUFFER, 'image/jpeg', 'user-1'),
    ).rejects.toThrow(AppError);
  });

  it('✅ throws 404 when vendor is soft-deleted', async () => {
    mockPrismaVendor.findUnique.mockResolvedValue({
      id: 'vendor-1',
      ownerUserId: 'user-1',
      deletedAt: new Date(),
    } as never);

    await expect(
      uploadsService.uploadVendorPhoto('vendor-1', SMALL_IMAGE_BUFFER, 'image/jpeg', 'user-1'),
    ).rejects.toThrow(AppError);
  });
});
