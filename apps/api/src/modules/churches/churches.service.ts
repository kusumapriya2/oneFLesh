// ============================================================
// OneFlesh — Churches Service
// ============================================================

import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';
import { sendEmail, EmailTemplates } from '../../utils/email.js';
import { paginate } from '../../utils/response.js';
import { notifyChurchApproved } from '../notifications/notifications.service.js';
import type { CreateChurchInput, UpdateChurchInput } from '@oneflesh/shared';
import { UserRole } from '@oneflesh/shared';
import type { PaginationMeta } from '@oneflesh/shared';
import type { Church } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────
interface ListChurchesFilters {
  status?: string;
  page: number;
  limit: number;
}

interface ListChurchesResult {
  items: Church[];
  meta: PaginationMeta;
}

// ─── Create church ────────────────────────────────────────────
export async function createChurch(data: CreateChurchInput): Promise<Church> {
  const existing = await prisma.church.findUnique({
    where: { pastorEmail: data.pastorEmail },
  });

  if (existing) {
    throw new AppError(409, 'CHURCH_EMAIL_EXISTS', 'A church with this pastor email already exists');
  }

  const church = await prisma.church.create({
    data: {
      name: data.name,
      denomination: data.denomination,
      city: data.city,
      state: data.state,
      pastorName: data.pastorName,
      pastorEmail: data.pastorEmail,
      pastorPhone: data.pastorPhone,
      congregationSize: data.congregationSize ?? null,
      yearEstablished: data.yearEstablished ?? null,
      doctrinalFlags: data.doctrinalFlags,
      status: 'PENDING',
    },
  });

  logger.info(`Church created: ${church.name} (${church.id}) status=PENDING`);
  return church;
}

// ─── List churches (super admin only) ────────────────────────
export async function listChurches(filters: ListChurchesFilters): Promise<ListChurchesResult> {
  const { status, page, limit } = filters;

  const where = status ? { status: status as Church['status'] } : {};

  const [items, total] = await prisma.$transaction([
    prisma.church.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.church.count({ where }),
  ]);

  return { items, meta: paginate(total, page, limit) };
}

// ─── Get church by ID ─────────────────────────────────────────
export async function getChurch(id: string): Promise<Church> {
  const church = await prisma.church.findUnique({ where: { id } });

  if (!church) {
    throw new AppError(404, 'CHURCH_NOT_FOUND', `Church ${id} not found`);
  }

  return church;
}

// ─── Approve church ───────────────────────────────────────────
export async function approveChurch(id: string, adminUserId: string): Promise<Church> {
  const church = await getChurch(id);

  if (church.status === 'APPROVED') {
    throw new AppError(409, 'ALREADY_APPROVED', 'Church is already approved');
  }

  const updated = await prisma.church.update({
    where: { id },
    data: { status: 'APPROVED' },
  });

  logger.info(`Church approved: ${church.name} (${id}) by admin=${adminUserId}`);

  // Send notification + email (non-blocking)
  notifyChurchApproved(id).catch((err) =>
    logger.error('notifyChurchApproved failed post-approve:', err),
  );

  return updated;
}

// ─── Reject church ────────────────────────────────────────────
export async function rejectChurch(
  id: string,
  reason: string,
  adminUserId: string,
): Promise<Church> {
  const church = await getChurch(id);

  if (church.status === 'REJECTED') {
    throw new AppError(409, 'ALREADY_REJECTED', 'Church is already rejected');
  }

  const updated = await prisma.church.update({
    where: { id },
    data: { status: 'REJECTED', rejectionReason: reason },
  });

  logger.info(`Church rejected: ${church.name} (${id}) by admin=${adminUserId}`);

  // Email the pastor with rejection reason
  sendEmail({
    to: church.pastorEmail,
    subject: 'OneFlesh Church Application Update',
    html: `
      <p>Dear ${church.pastorName},</p>
      <p>Unfortunately, your church application for <strong>${church.name}</strong> could not be approved at this time.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please contact us if you have questions.</p>
    `,
  }).catch((err) => logger.error('Church rejection email failed:', err));

  return updated;
}

// ─── Update church ────────────────────────────────────────────
export async function updateChurch(
  id: string,
  data: UpdateChurchInput,
  userId: string,
  userRole: UserRole,
): Promise<Church> {
  const church = await getChurch(id);

  // Non-admin users can only update their own church
  if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.CHURCH_ADMIN) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.churchId !== id) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to update this church');
    }
  }

  // If doctrinalFlags changed, re-examine — flag for admin review
  const doctrinalChanged =
    data.doctrinalFlags !== undefined &&
    JSON.stringify(data.doctrinalFlags) !== JSON.stringify(church.doctrinalFlags);

  const updated = await prisma.church.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.denomination !== undefined && { denomination: data.denomination }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.pastorName !== undefined && { pastorName: data.pastorName }),
      ...(data.pastorEmail !== undefined && { pastorEmail: data.pastorEmail }),
      ...(data.pastorPhone !== undefined && { pastorPhone: data.pastorPhone }),
      ...(data.congregationSize !== undefined && { congregationSize: data.congregationSize }),
      ...(data.yearEstablished !== undefined && { yearEstablished: data.yearEstablished }),
      ...(data.doctrinalFlags !== undefined && { doctrinalFlags: data.doctrinalFlags }),
      // Re-trigger review if doctrinal flags changed
      ...(doctrinalChanged && { status: 'PENDING' }),
    },
  });

  if (doctrinalChanged) {
    logger.info(
      `Church ${id} doctrinal flags changed — reverted to PENDING for admin review (updatedBy=${userId})`,
    );
  }

  return updated;
}

// ─── Delete (soft) church ─────────────────────────────────────
export async function deleteChurch(id: string): Promise<void> {
  await getChurch(id); // throws 404 if not found

  await prisma.church.update({
    where: { id },
    data: { status: 'SUSPENDED' },
  });

  logger.info(`Church suspended (soft-deleted): ${id}`);
}
