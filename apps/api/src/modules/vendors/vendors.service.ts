// ============================================================
// OneFlesh — Vendors Service
// ============================================================

import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';
import { paginate } from '../../utils/response.js';
import { sendEmail } from '../../utils/email.js';
import { createNotification } from '../notifications/notifications.service.js';
import type { CreateVendorInput, UpdateVendorInput, VendorSearchInput, PaginationMeta } from '@oneflesh/shared';
import { UserRole, NotificationType } from '@oneflesh/shared';
import type { Vendor } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────

interface ListVendorsResult {
  items: Vendor[];
  meta: PaginationMeta;
}

// ─── Create vendor ────────────────────────────────────────────

export async function createVendor(
  data: CreateVendorInput,
  ownerUserId: string,
): Promise<Vendor> {
  const vendor = await prisma.vendor.create({
    data: {
      businessName: data.businessName,
      category: data.category,
      location: data.location,
      city: data.city,
      state: data.state,
      description: data.description,
      priceFrom: data.priceFrom ?? null,
      priceType: data.priceType ?? null,
      ownerName: data.ownerName,
      phone: data.phone,
      email: data.email,
      website: data.website ?? null,
      churchId: data.churchId ?? null,
      ownerUserId,
      status: 'PENDING',
    },
  });

  logger.info(`Vendor created: ${vendor.id} (${vendor.businessName}) by user ${ownerUserId}`);

  return vendor;
}

// ─── List vendors ─────────────────────────────────────────────

export async function listVendors(filters: VendorSearchInput): Promise<ListVendorsResult> {
  const { category, state, verified, featured, q, page, limit } = filters;

  // Only show APPROVED vendors to regular users
  const where: Record<string, unknown> = {
    status: 'APPROVED',
    deletedAt: null,
  };

  if (category) where['category'] = category;
  if (state) where['state'] = state;
  if (verified !== undefined) where['verified'] = verified;
  if (featured !== undefined) where['featured'] = featured;

  if (q) {
    where['OR'] = [
      { businessName: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { city: { contains: q, mode: 'insensitive' } },
      { ownerName: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.vendor.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vendor.count({ where }),
  ]);

  return { items, meta: paginate(total, page, limit) };
}

// ─── Get vendor ───────────────────────────────────────────────

export async function getVendor(id: string): Promise<Vendor> {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      church: { select: { id: true, name: true, denomination: true, city: true } },
    },
  });

  if (!vendor || vendor.deletedAt) {
    throw new AppError(404, 'VENDOR_NOT_FOUND', `Vendor ${id} not found`);
  }

  return vendor;
}

// ─── Update vendor ────────────────────────────────────────────

export async function updateVendor(
  id: string,
  data: UpdateVendorInput,
  userId: string,
  userRole: UserRole,
): Promise<Vendor> {
  const vendor = await prisma.vendor.findUnique({ where: { id } });

  if (!vendor || vendor.deletedAt) {
    throw new AppError(404, 'VENDOR_NOT_FOUND', `Vendor ${id} not found`);
  }

  // Ownership or admin check
  const isAdmin = userRole === UserRole.SUPER_ADMIN;
  const isOwner = vendor.ownerUserId === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to update this vendor');
  }

  const updated = await prisma.vendor.update({
    where: { id },
    data: {
      ...(data.businessName !== undefined && { businessName: data.businessName }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priceFrom !== undefined && { priceFrom: data.priceFrom }),
      ...(data.priceType !== undefined && { priceType: data.priceType }),
      ...(data.ownerName !== undefined && { ownerName: data.ownerName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.churchId !== undefined && { churchId: data.churchId }),
    },
  });

  logger.info(`Vendor ${id} updated by user ${userId}`);

  return updated;
}

// ─── Verify vendor ────────────────────────────────────────────

export async function verifyVendor(id: string): Promise<Vendor> {
  const vendor = await prisma.vendor.findUnique({ where: { id } });

  if (!vendor || vendor.deletedAt) {
    throw new AppError(404, 'VENDOR_NOT_FOUND', `Vendor ${id} not found`);
  }

  const updated = await prisma.vendor.update({
    where: { id },
    data: {
      verified: true,
      status: 'APPROVED',
    },
  });

  logger.info(`Vendor ${id} (${vendor.businessName}) verified and approved`);

  return updated;
}

// ─── Feature vendor (toggle) ──────────────────────────────────

export async function featureVendor(id: string): Promise<Vendor> {
  const vendor = await prisma.vendor.findUnique({ where: { id } });

  if (!vendor || vendor.deletedAt) {
    throw new AppError(404, 'VENDOR_NOT_FOUND', `Vendor ${id} not found`);
  }

  const updated = await prisma.vendor.update({
    where: { id },
    data: {
      featured: !vendor.featured,
    },
  });

  logger.info(`Vendor ${id} featured toggled to ${updated.featured}`);

  return updated;
}

// ─── Delete vendor (soft) ─────────────────────────────────────

export async function deleteVendor(id: string, userId: string, userRole: UserRole): Promise<void> {
  const vendor = await prisma.vendor.findUnique({ where: { id } });

  if (!vendor || vendor.deletedAt) {
    throw new AppError(404, 'VENDOR_NOT_FOUND', `Vendor ${id} not found`);
  }

  const isAdmin = userRole === UserRole.SUPER_ADMIN;
  const isOwner = vendor.ownerUserId === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to delete this vendor');
  }

  await prisma.vendor.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  logger.info(`Vendor ${id} soft-deleted by user ${userId}`);
}

// ─── Contact vendor ───────────────────────────────────────────

export async function contactVendor(id: string, requestingPastorId: string): Promise<void> {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      church: { select: { name: true } },
    },
  });

  if (!vendor || vendor.deletedAt) {
    throw new AppError(404, 'VENDOR_NOT_FOUND', `Vendor ${id} not found`);
  }

  if (vendor.status !== 'APPROVED') {
    throw new AppError(422, 'VENDOR_NOT_APPROVED', 'This vendor is not approved for contact');
  }

  // Get requesting pastor details
  const pastor = await prisma.user.findUnique({
    where: { id: requestingPastorId },
    include: {
      church: { select: { name: true, pastorName: true, pastorEmail: true } },
    },
  });

  if (!pastor) {
    throw new AppError(404, 'PASTOR_NOT_FOUND', `Requesting pastor not found`);
  }

  const pastorName = pastor.church?.pastorName ?? 'A pastor';
  const churchName = pastor.church?.name ?? 'A church';

  // Create VENDOR_CONTACT notification for the vendor owner
  if (vendor.ownerUserId) {
    await createNotification(
      vendor.ownerUserId,
      NotificationType.VENDOR_CONTACT,
      'New Contact Request',
      `${pastorName} from ${churchName} is interested in your services (${vendor.businessName}).`,
      'Vendor',
      id,
    );
  }

  // Log the contact request in audit log
  logger.info(
    `Vendor contact: vendorId=${id} business="${vendor.businessName}" requestingPastor=${requestingPastorId} church="${churchName}"`,
  );

  // Send email with vendor contact details to the requesting pastor
  await sendEmail({
    to: pastor.email,
    subject: `Vendor Contact Details — ${vendor.businessName} — OneFlesh`,
    html: buildVendorContactEmail(pastorName, vendor),
  });
}

// ─── Email template helper ────────────────────────────────────

function buildVendorContactEmail(
  pastorName: string,
  vendor: Vendor & { church?: { name: string } | null },
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: 'Georgia', serif; background: #faf6f0; color: #3d1a1e; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff9f4; border: 1px solid rgba(107,15,26,0.12); border-radius: 8px; overflow: hidden; }
    .header { background: #4a0a12; padding: 28px 36px; text-align: center; }
    .logo { font-size: 22px; color: #e2c97e; letter-spacing: 0.04em; }
    .body { padding: 32px 36px; }
    .footer { background: #4a0a12; padding: 16px 36px; text-align: center; font-size: 11px; color: rgba(250,246,240,0.45); }
    h2 { color: #4a0a12; font-size: 22px; font-weight: 400; margin-bottom: 12px; }
    p { line-height: 1.7; color: #3d1a1e; font-size: 14px; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid rgba(107,15,26,0.08); }
    .detail-label { font-weight: 600; color: #4a0a12; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">One<em style="font-style:italic;font-weight:300">Flesh</em></div>
      <div style="font-size:11px;color:rgba(226,201,126,0.6);margin-top:5px;letter-spacing:0.1em;text-transform:uppercase;">Reformed Church Matrimonial Platform</div>
    </div>
    <div class="body">
      <h2>Vendor Contact Details</h2>
      <p>Dear ${pastorName},</p>
      <p>Here are the contact details for the vendor you requested:</p>
      <div class="detail-row"><span class="detail-label">Business Name:</span> ${vendor.businessName}</div>
      <div class="detail-row"><span class="detail-label">Category:</span> ${vendor.category}</div>
      <div class="detail-row"><span class="detail-label">Location:</span> ${vendor.location}, ${vendor.city}, ${vendor.state}</div>
      <div class="detail-row"><span class="detail-label">Owner:</span> ${vendor.ownerName}</div>
      <div class="detail-row"><span class="detail-label">Phone:</span> ${vendor.phone}</div>
      <div class="detail-row"><span class="detail-label">Email:</span> ${vendor.email}</div>
      ${vendor.website ? `<div class="detail-row"><span class="detail-label">Website:</span> <a href="${vendor.website}">${vendor.website}</a></div>` : ''}
      ${vendor.priceFrom ? `<div class="detail-row"><span class="detail-label">Price From:</span> ${vendor.priceFrom} ${vendor.priceType ?? ''}</div>` : ''}
      ${vendor.church ? `<div class="detail-row"><span class="detail-label">Church:</span> ${vendor.church.name}</div>` : ''}
      <p style="margin-top:20px;font-style:italic;color:#7a5a5e;">Please contact the vendor directly. OneFlesh does not mediate vendor transactions.</p>
    </div>
    <div class="footer">© OneFlesh · Built for Reformed churches across India · All alliances pastoral-approved</div>
  </div>
</body>
</html>
`;
}
