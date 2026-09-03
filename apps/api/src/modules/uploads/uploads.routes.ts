// ============================================================
// OneFlesh — Uploads Routes
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as uploadsService from './uploads.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePastor } from '../../middleware/authorize.js';
import { uploadLimiter } from '../../middleware/rateLimiter.js';
import { sendCreated } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';

export const uploadRouter: Router = Router();

// ─── Multer configuration ─────────────────────────────────────
// Memory storage, 5MB max, JPEG/PNG/WebP only

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const multerStorage = multer.memoryStorage();

const multerFilter: multer.Options['fileFilter'] = (
  _req,
  file,
  callback,
) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    callback(null, true);
  } else {
    callback(new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Only JPEG, PNG, and WebP images are accepted'));
  }
};

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: multerFilter,
});

// ─── POST /profile/:profileId ─────────────────────────────────
async function handleProfileUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError(400, 'NO_FILE', 'No photo file was provided');
    }

    const profileId = req.params['profileId'] as string;

    const result = await uploadsService.uploadProfilePhoto(
      profileId,
      req.file.buffer,
      req.file.mimetype,
      req.user!.sub,
    );

    sendCreated(res, result);
  } catch (err) {
    next(err);
  }
}

// ─── POST /vendor/:vendorId ───────────────────────────────────
async function handleVendorUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError(400, 'NO_FILE', 'No photo file was provided');
    }

    const vendorId = req.params['vendorId'] as string;

    const result = await uploadsService.uploadVendorPhoto(
      vendorId,
      req.file.buffer,
      req.file.mimetype,
      req.user!.sub,
    );

    sendCreated(res, result);
  } catch (err) {
    next(err);
  }
}

// ─── Route definitions ────────────────────────────────────────

uploadRouter.post(
  '/profile/:profileId',
  authenticate,
  requirePastor,
  uploadLimiter,
  upload.single('photo'),
  handleProfileUpload,
);

uploadRouter.post(
  '/vendor/:vendorId',
  authenticate,
  uploadLimiter,
  upload.single('photo'),
  handleVendorUpload,
);
