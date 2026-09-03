// ============================================================
// OneFlesh — Profiles Routes
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as profileService from './profiles.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin, requirePastor } from '../../middleware/authorize.js';
import { churchGuard } from '../../middleware/churchGuard.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { uploadLimiter } from '../../middleware/rateLimiter.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';
import { s3Client, S3_BUCKET } from '../../config/aws.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateProfileSchema,
  UpdateProfileSchema,
  ProfileSearchSchema,
} from '@oneflesh/shared';
import type { UserRole } from '@oneflesh/shared';

// ─── Multer — memory storage (files uploaded to S3) ──────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(415, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, or WebP images are accepted'));
    }
  },
});

export const profileRouter: Router = Router();

// ─── POST / — Create profile ──────────────────────────────────
async function handleCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.createProfile(
      req.body,
      req.user!.sub,
      req.user!.churchId ?? '',
    );
    sendCreated(res, profile);
  } catch (err) {
    next(err);
  }
}

// ─── GET / — List profiles ────────────────────────────────────
async function handleList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await profileService.listProfiles(
      req.query as unknown as Parameters<typeof profileService.listProfiles>[0],
      req.user!,
    );
    sendSuccess(res, result.items, 200, result.meta);
  } catch (err) {
    next(err);
  }
}

// ─── GET /shortlist — Get pastor's shortlist ──────────────────
async function handleGetShortlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entries = await profileService.getShortlist(req.user!.sub);
    sendSuccess(res, entries);
  } catch (err) {
    next(err);
  }
}

// ─── GET /:id — Get profile ───────────────────────────────────
async function handleGet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.getProfile(req.params['id'] as string, req.user!);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /:id — Update profile ────────────────────────────────
async function handleUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.updateProfile(
      req.params['id'] as string,
      req.body,
      req.user!.sub,
      req.user!.role as UserRole,
    );
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /:id/approve ───────────────────────────────────────
async function handleApprove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.approveProfile(req.params['id'] as string);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /:id/pause ─────────────────────────────────────────
async function handlePause(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileService.pauseProfile(
      req.params['id'] as string,
      req.user!.sub,
    );
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /:id ──────────────────────────────────────────────
async function handleDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await profileService.deleteProfile(
      req.params['id'] as string,
      req.user!.sub,
      req.user!.role as UserRole,
    );
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

// ─── POST /:id/photo — Upload photo to S3 ─────────────────────
async function handlePhotoUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError(400, 'NO_FILE', 'No photo file provided');
    }

    const profileId = req.params['id'] as string;
    const ext = req.file.mimetype.split('/')[1] ?? 'jpg';
    const key = `profiles/${profileId}/${uuidv4()}.${ext}`;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }),
    );

    const s3Url = `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
    const profile = await profileService.uploadProfilePhoto(profileId, s3Url);

    sendSuccess(res, { photoUrl: profile.photoUrl, key });
  } catch (err) {
    next(err);
  }
}

// ─── POST /shortlist/:id — Add to shortlist ───────────────────
async function handleAddShortlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entry = await profileService.addShortlist(
      req.user!.sub,
      req.params['id'] as string,
    );
    sendCreated(res, entry);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /shortlist/:id — Remove from shortlist ────────────
async function handleRemoveShortlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await profileService.removeShortlist(
      req.user!.sub,
      req.params['id'] as string,
    );
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

// ─── Route definitions ────────────────────────────────────────

// IMPORTANT: exact-path routes must come before parameterized routes
profileRouter.post(
  '/',
  authenticate,
  churchGuard,
  requirePastor,
  validateBody(CreateProfileSchema),
  handleCreate,
);

profileRouter.get(
  '/',
  authenticate,
  validateQuery(ProfileSearchSchema),
  handleList,
);

// /shortlist before /:id to prevent route shadowing
profileRouter.get('/shortlist', authenticate, requirePastor, handleGetShortlist);

profileRouter.get('/:id', authenticate, handleGet);

profileRouter.put(
  '/:id',
  authenticate,
  requirePastor,
  validateBody(UpdateProfileSchema),
  handleUpdate,
);

profileRouter.patch('/:id/approve', authenticate, requireAdmin, handleApprove);

profileRouter.patch('/:id/pause', authenticate, requirePastor, handlePause);

profileRouter.delete('/:id', authenticate, requirePastor, handleDelete);

profileRouter.post(
  '/:id/photo',
  authenticate,
  requirePastor,
  uploadLimiter,
  upload.single('photo'),
  handlePhotoUpload,
);

profileRouter.post(
  '/shortlist/:id',
  authenticate,
  requirePastor,
  handleAddShortlist,
);

profileRouter.delete(
  '/shortlist/:id',
  authenticate,
  requirePastor,
  handleRemoveShortlist,
);
