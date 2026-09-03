// ============================================================
// OneFlesh — Profiles Service
// ============================================================

import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';
import { paginate } from '../../utils/response.js';
import { s3Client, S3_BUCKET } from '../../config/aws.js';
import { env } from '../../config/env.js';
import { notifyProfileApproved } from '../notifications/notifications.service.js';
import type {
  CreateProfileInput,
  UpdateProfileInput,
  ProfileSearchInput,
  JwtPayload,
  PaginationMeta,
} from '@oneflesh/shared';
import { UserRole } from '@oneflesh/shared';
import type { Profile, ShortlistedProfile, Prisma } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────
interface ProfileWithRelations extends Profile {
  church?: unknown;
  pastor?: unknown;
}

interface ListProfilesResult {
  items: ProfileWithRelations[];
  meta: PaginationMeta;
}

interface ShortlistEntry extends ShortlistedProfile {
  profile: Profile;
}

// ─── Create profile ───────────────────────────────────────────
export async function createProfile(
  data: CreateProfileInput,
  pastorId: string,
  churchId: string,
): Promise<Profile> {
  const profile = await prisma.profile.create({
    data: {
      churchId,
      pastorId,
      fullName: data.fullName,
      age: data.age,
      city: data.city,
      state: data.state,
      education: data.education ?? null,
      occupation: data.occupation ?? null,
      seeking: data.seeking,
      testimony: data.testimony,
      ministryInvolvement: data.ministryInvolvement ?? null,
      pastorRecommendation: data.pastorRecommendation,
      endorsements: data.endorsements as object[],
      fatherName: data.fatherName ?? null,
      yearsInChurch: data.yearsInChurch ?? null,
      status: 'PENDING',
    },
  });

  logger.info(`Profile created: ${profile.id} by pastor=${pastorId} church=${churchId}`);
  return profile;
}

// ─── List profiles ────────────────────────────────────────────
// Visibility rules:
//   SUPER_ADMIN / CHURCH_ADMIN → all statuses
//   PASTOR                     → APPROVED from all + own church any status
//   Others                     → APPROVED only
export async function listProfiles(
  filters: ProfileSearchInput,
  requestingUser: JwtPayload,
): Promise<ListProfilesResult> {
  const { state, seeking, ageMin, ageMax, denomination, q, page, limit } = filters;
  const isAdmin =
    requestingUser.role === UserRole.SUPER_ADMIN ||
    requestingUser.role === UserRole.CHURCH_ADMIN;
  const isPastor = requestingUser.role === UserRole.PASTOR;

  // ── Base constraints (always applied) ─────────────────────
  const andClauses: Prisma.ProfileWhereInput[] = [{ deletedAt: null }];

  // ── Status / visibility ────────────────────────────────────
  if (!isAdmin) {
    if (isPastor && requestingUser.churchId) {
      // Pastor: APPROVED everywhere OR anything from their own church
      andClauses.push({
        OR: [
          { status: 'APPROVED' },
          { churchId: requestingUser.churchId },
        ],
      });
    } else {
      andClauses.push({ status: 'APPROVED' });
    }
  }

  // ── Scalar filters ─────────────────────────────────────────
  if (state)   andClauses.push({ state });
  if (seeking) andClauses.push({ seeking });
  if (ageMin !== undefined || ageMax !== undefined) {
    andClauses.push({
      age: {
        ...(ageMin !== undefined && { gte: ageMin }),
        ...(ageMax !== undefined && { lte: ageMax }),
      },
    });
  }

  // ── Text search — separate OR that doesn't conflict with status OR ──
  if (q) {
    andClauses.push({
      OR: [
        { fullName: { contains: q, mode: 'insensitive' } },
        { city:     { contains: q, mode: 'insensitive' } },
        { occupation: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  // ── Denomination filter via church relation ────────────────
  const churchWhere: Prisma.ChurchWhereInput | undefined = denomination
    ? { denomination: { contains: denomination, mode: 'insensitive' } }
    : undefined;

  const findOptions = {
    where: {
      AND: andClauses,
      ...(churchWhere && { church: churchWhere }),
    },
    include: {
      church: {
        select: { id: true, name: true, denomination: true, city: true, state: true },
      },
      pastor: {
        select: { id: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' } as const,
    skip: (page - 1) * limit,
    take: limit,
  };

  const [items, total] = await prisma.$transaction([
    prisma.profile.findMany(findOptions),
    prisma.profile.count({ where: findOptions.where }),
  ]);

  return { items, meta: paginate(total, page, limit) };
}

// ─── Get profile (full details — pastor/admin) ────────────────
export async function getProfile(
  id: string,
  requestingUser: JwtPayload,
): Promise<ProfileWithRelations> {
  const profile = await prisma.profile.findUnique({
    where: { id, deletedAt: null },
    include: {
      church: true,
      pastor: { select: { id: true, email: true, role: true } },
    },
  });

  if (!profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', `Profile ${id} not found`);
  }

  // APPROVED profiles visible to all authenticated users
  // Unapproved or deleted profiles restricted to the owning pastor or admin
  if (
    profile.status !== 'APPROVED' &&
    requestingUser.role !== UserRole.SUPER_ADMIN &&
    requestingUser.role !== UserRole.CHURCH_ADMIN &&
    profile.pastorId !== requestingUser.sub
  ) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You do not have permission to view this profile',
    );
  }

  return profile;
}

// ─── Update profile ───────────────────────────────────────────
export async function updateProfile(
  id: string,
  data: UpdateProfileInput,
  userId: string,
  userRole: UserRole,
): Promise<Profile> {
  const profile = await prisma.profile.findUnique({
    where: { id, deletedAt: null },
  });

  if (!profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', `Profile ${id} not found`);
  }

  // Must own or be admin
  if (
    userRole !== UserRole.SUPER_ADMIN &&
    userRole !== UserRole.CHURCH_ADMIN &&
    profile.pastorId !== userId
  ) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to update this profile');
  }

  const updated = await prisma.profile.update({
    where: { id },
    data: {
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.age !== undefined && { age: data.age }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.education !== undefined && { education: data.education }),
      ...(data.occupation !== undefined && { occupation: data.occupation }),
      ...(data.seeking !== undefined && { seeking: data.seeking }),
      ...(data.testimony !== undefined && { testimony: data.testimony }),
      ...(data.ministryInvolvement !== undefined && {
        ministryInvolvement: data.ministryInvolvement,
      }),
      ...(data.pastorRecommendation !== undefined && {
        pastorRecommendation: data.pastorRecommendation,
      }),
      ...(data.endorsements !== undefined && { endorsements: data.endorsements as object[] }),
      ...(data.fatherName !== undefined && { fatherName: data.fatherName }),
      ...(data.yearsInChurch !== undefined && { yearsInChurch: data.yearsInChurch }),
    },
  });

  return updated;
}

// ─── Approve profile ──────────────────────────────────────────
export async function approveProfile(id: string): Promise<Profile> {
  const profile = await prisma.profile.findUnique({ where: { id, deletedAt: null } });

  if (!profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', `Profile ${id} not found`);
  }

  const updated = await prisma.profile.update({
    where: { id },
    data: { status: 'APPROVED' },
  });

  logger.info(`Profile approved: ${id}`);

  // Notify pastor (non-blocking)
  notifyProfileApproved(id).catch((err) =>
    logger.error('notifyProfileApproved failed:', err),
  );

  return updated;
}

// ─── Pause profile ────────────────────────────────────────────
export async function pauseProfile(id: string, userId: string): Promise<Profile> {
  const profile = await prisma.profile.findUnique({
    where: { id, deletedAt: null },
  });

  if (!profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', `Profile ${id} not found`);
  }

  if (profile.pastorId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not own this profile');
  }

  return prisma.profile.update({
    where: { id },
    data: { status: 'PAUSED' },
  });
}

// ─── Delete profile (soft, schedule hard delete) ──────────────
export async function deleteProfile(
  id: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { id, deletedAt: null },
  });

  if (!profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', `Profile ${id} not found`);
  }

  if (
    userRole !== UserRole.SUPER_ADMIN &&
    userRole !== UserRole.CHURCH_ADMIN &&
    profile.pastorId !== userId
  ) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to delete this profile');
  }

  const hardDeleteAt = new Date(
    Date.now() + (env.PROFILE_HARD_DELETE_DAYS ?? 30) * 24 * 60 * 60 * 1000,
  );

  await prisma.profile.update({
    where: { id },
    data: {
      status: 'DELETED',
      deletedAt: new Date(),
      hardDeleteAt,
    },
  });

  logger.info(`Profile soft-deleted: ${id} — hard delete scheduled: ${hardDeleteAt.toISOString()}`);
}

// ─── Upload profile photo ─────────────────────────────────────
export async function uploadProfilePhoto(id: string, s3Url: string): Promise<Profile> {
  const profile = await prisma.profile.findUnique({ where: { id } });

  if (!profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', `Profile ${id} not found`);
  }

  return prisma.profile.update({
    where: { id },
    data: { photoUrl: s3Url },
  });
}

/**
 * Generate a pre-signed S3 PUT URL for direct browser upload.
 * Returns the S3 key and the pre-signed URL.
 */
export async function getPhotoUploadUrl(
  profileId: string,
  contentType: string,
): Promise<{ uploadUrl: string; key: string }> {
  const ext = contentType.split('/')[1] ?? 'jpg';
  const key = `profiles/${profileId}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return { uploadUrl, key };
}

/**
 * Generate a pre-signed S3 GET URL to serve a profile photo.
 */
export async function getPhotoDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// ─── Shortlist: add ───────────────────────────────────────────
export async function addShortlist(pastorId: string, profileId: string): Promise<ShortlistedProfile> {
  // Verify profile exists and is APPROVED
  const profile = await prisma.profile.findUnique({
    where: { id: profileId, status: 'APPROVED', deletedAt: null },
  });

  if (!profile) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found or not yet approved');
  }

  // Enforce max 20 shortlists
  const count = await prisma.shortlistedProfile.count({ where: { pastorId } });
  if (count >= 20) {
    throw new AppError(
      422,
      'SHORTLIST_FULL',
      'Shortlist is full. Remove a profile before adding another (max 20).',
    );
  }

  // Upsert to avoid duplicate error leaking
  const existing = await prisma.shortlistedProfile.findUnique({
    where: { pastorId_profileId: { pastorId, profileId } },
  });

  if (existing) {
    throw new AppError(409, 'ALREADY_SHORTLISTED', 'This profile is already in your shortlist');
  }

  return prisma.shortlistedProfile.create({
    data: { pastorId, profileId },
  });
}

// ─── Shortlist: remove ────────────────────────────────────────
export async function removeShortlist(pastorId: string, profileId: string): Promise<void> {
  const entry = await prisma.shortlistedProfile.findUnique({
    where: { pastorId_profileId: { pastorId, profileId } },
  });

  if (!entry) {
    throw new AppError(404, 'NOT_IN_SHORTLIST', 'Profile not found in shortlist');
  }

  await prisma.shortlistedProfile.delete({
    where: { pastorId_profileId: { pastorId, profileId } },
  });
}

// ─── Shortlist: get ───────────────────────────────────────────
export async function getShortlist(pastorId: string): Promise<ShortlistEntry[]> {
  const entries = await prisma.shortlistedProfile.findMany({
    where: { pastorId },
    include: {
      profile: {
        include: {
          church: {
            select: { id: true, name: true, denomination: true, city: true, state: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return entries as ShortlistEntry[];
}
