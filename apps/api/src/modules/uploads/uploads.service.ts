// ============================================================
// OneFlesh — Uploads Service (Sharp + S3)
// ============================================================

import sharp from 'sharp';
import {
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '../../config/aws.js';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';

// ─── Types ────────────────────────────────────────────────────

interface ProfileUploadResult {
  thumbnailUrl: string;
  mediumUrl: string;
}

interface VendorUploadResult {
  photoUrl: string;
}

const SIGNED_URL_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

// ─── Profile photo upload ─────────────────────────────────────

export async function uploadProfilePhoto(
  profileId: string,
  fileBuffer: Buffer,
  mimeType: string,
  uploaderUserId: string,
): Promise<ProfileUploadResult> {
  // Verify profile exists
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { id: true, pastorId: true, churchId: true },
  });

  if (!profile || !profile.id) {
    throw new AppError(404, 'PROFILE_NOT_FOUND', `Profile ${profileId} not found`);
  }

  // H-05: Ownership check — only the pastor who created the profile may upload photos
  if (profile.pastorId !== uploaderUserId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to upload photos for this profile');
  }

  // Determine content type for S3
  const contentType = resolveImageContentType(mimeType);

  // Generate thumbnail (200×200) — square crop
  const thumbnailBuffer = await sharp(fileBuffer)
    .resize(200, 200, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();

  // Generate medium (600×600) — square crop
  const mediumBuffer = await sharp(fileBuffer)
    .resize(600, 600, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();

  const thumbKey = `profiles/${profileId}/thumb.jpg`;
  const mediumKey = `profiles/${profileId}/medium.jpg`;

  // Upload both to S3 in parallel
  await Promise.all([
    s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: thumbKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        // Private — no public ACL
        Metadata: {
          profileId,
          uploaderUserId,
          originalContentType: contentType,
        },
      }),
    ),
    s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: mediumKey,
        Body: mediumBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          profileId,
          uploaderUserId,
          originalContentType: contentType,
        },
      }),
    ),
  ]);

  logger.info(`Profile photo uploaded: profileId=${profileId} by user=${uploaderUserId}`);

  // Generate 24h signed URLs for private bucket access
  const [thumbnailUrl, mediumUrl] = await Promise.all([
    getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: thumbKey }),
      { expiresIn: SIGNED_URL_EXPIRY_SECONDS },
    ),
    getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: mediumKey }),
      { expiresIn: SIGNED_URL_EXPIRY_SECONDS },
    ),
  ]);

  // Persist the S3 key as the photoUrl (the API returns signed URLs, but we store the path)
  await prisma.profile.update({
    where: { id: profileId },
    data: { photoUrl: mediumKey },
  });

  return { thumbnailUrl, mediumUrl };
}

// ─── Vendor photo upload ──────────────────────────────────────

export async function uploadVendorPhoto(
  vendorId: string,
  fileBuffer: Buffer,
  mimeType: string,
  uploaderUserId: string,
): Promise<VendorUploadResult> {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, ownerUserId: true, deletedAt: true },
  });

  if (!vendor || vendor.deletedAt) {
    throw new AppError(404, 'VENDOR_NOT_FOUND', `Vendor ${vendorId} not found`);
  }

  const contentType = resolveImageContentType(mimeType);

  // Vendor photos: resize to 800×600, preserve aspect ratio, pad if needed
  const processedBuffer = await sharp(fileBuffer)
    .resize(800, 600, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88, progressive: true })
    .toBuffer();

  const photoKey = `vendors/${vendorId}/photo.jpg`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: photoKey,
      Body: processedBuffer,
      ContentType: 'image/jpeg',
      // Vendor photos are public
      ACL: 'public-read',
      Metadata: {
        vendorId,
        uploaderUserId,
        originalContentType: contentType,
      },
    }),
  );

  logger.info(`Vendor photo uploaded: vendorId=${vendorId} by user=${uploaderUserId}`);

  // Public URL (no signing needed for public-read)
  const photoUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${photoKey}`;

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { photoUrl },
  });

  return { photoUrl };
}

// ─── Helper: resolve content type ────────────────────────────

function resolveImageContentType(mimeType: string): string {
  const allowed: Record<string, string> = {
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/png': 'image/png',
    'image/webp': 'image/webp',
  };

  const resolved = allowed[mimeType.toLowerCase()];
  if (!resolved) {
    throw new AppError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Only JPEG, PNG, and WebP images are accepted',
    );
  }
  return resolved;
}
