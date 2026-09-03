// ============================================================
// OneFlesh — Vendors Routes
// ============================================================

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as vendorsService from './vendors.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin, requirePastor } from '../../middleware/authorize.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.js';
import {
  CreateVendorSchema,
  UpdateVendorSchema,
  VendorSearchSchema,
} from '@oneflesh/shared';
import type { UserRole } from '@oneflesh/shared';

export const vendorRouter: Router = Router();

// ─── POST / — Create vendor ───────────────────────────────────
async function handleCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendor = await vendorsService.createVendor(req.body, req.user!.sub);
    sendCreated(res, vendor);
  } catch (err) {
    next(err);
  }
}

// ─── GET / — List vendors ─────────────────────────────────────
async function handleList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await vendorsService.listVendors(
      req.query as unknown as Parameters<typeof vendorsService.listVendors>[0]
    );
    sendSuccess(res, result.items, 200, result.meta);
  } catch (err) {
    next(err);
  }
}

// ─── GET /:id — Get vendor ────────────────────────────────────
async function handleGet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendor = await vendorsService.getVendor(req.params['id'] as string);
    sendSuccess(res, vendor);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /:id — Update vendor ─────────────────────────────────
async function handleUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendor = await vendorsService.updateVendor(
      req.params['id'] as string,
      req.body,
      req.user!.sub,
      req.user!.role as UserRole,
    );
    sendSuccess(res, vendor);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /:id/verify — Verify vendor ───────────────────────
async function handleVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendor = await vendorsService.verifyVendor(req.params['id'] as string);
    sendSuccess(res, vendor);
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /:id/feature — Feature/unfeature vendor ───────────
async function handleFeature(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendor = await vendorsService.featureVendor(req.params['id'] as string);
    sendSuccess(res, vendor);
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /:id — Delete vendor ─────────────────────────────
async function handleDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await vendorsService.deleteVendor(
      req.params['id'] as string,
      req.user!.sub,
      req.user!.role as UserRole,
    );
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

// ─── POST /:id/contact — Contact vendor ──────────────────────
async function handleContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await vendorsService.contactVendor(req.params['id'] as string, req.user!.sub);
    sendSuccess(res, { message: 'Contact request sent. Vendor details have been emailed to you.' });
  } catch (err) {
    next(err);
  }
}

// ─── Route definitions ────────────────────────────────────────

vendorRouter.post(
  '/',
  authenticate,
  requirePastor,
  validateBody(CreateVendorSchema),
  handleCreate,
);

vendorRouter.get(
  '/',
  authenticate,
  validateQuery(VendorSearchSchema),
  handleList,
);

vendorRouter.get('/:id', authenticate, handleGet);

vendorRouter.put(
  '/:id',
  authenticate,
  validateBody(UpdateVendorSchema),
  handleUpdate,
);

vendorRouter.patch('/:id/verify', authenticate, requireAdmin, handleVerify);

vendorRouter.patch('/:id/feature', authenticate, requireAdmin, handleFeature);

vendorRouter.delete('/:id', authenticate, handleDelete);

vendorRouter.post('/:id/contact', authenticate, requirePastor, handleContact);
