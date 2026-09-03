// ============================================================
// OneFlesh — Alliances Service
// ============================================================

import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';
import { paginate } from '../../utils/response.js';
import { emitToUser } from '../../socket/index.js';
import {
  notifyNewInterest,
  notifyAllianceAdvanced,
} from '../notifications/notifications.service.js';
import type {
  CreateAllianceInput,
  AdvanceAllianceInput,
  PaginationMeta,
} from '@oneflesh/shared';
import { UserRole } from '@oneflesh/shared';
import type { Alliance, AllianceNote } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────
interface ListAlliancesFilters {
  status?: string;
  stage?: number;
  page: number;
  limit: number;
}

interface ListAlliancesResult {
  items: Alliance[];
  meta: PaginationMeta;
}

interface AllianceWithRelations extends Alliance {
  profile1?: unknown;
  profile2?: unknown;
  church1?: unknown;
  church2?: unknown;
  notes?: AllianceNote[];
}

const MAX_STAGE = 5;
const COUNSELLING_STAGE = 4;
const REQUIRED_COUNSELLING_SESSIONS = 6;

// ─── Create alliance ──────────────────────────────────────────
export async function createAlliance(
  data: CreateAllianceInput,
  creatingUserId: string,
): Promise<Alliance> {
  // Verify both profiles exist and are APPROVED
  const [profile1, profile2] = await Promise.all([
    prisma.profile.findUnique({ where: { id: data.profile1Id } }),
    prisma.profile.findUnique({ where: { id: data.profile2Id } }),
  ]);

  if (!profile1 || profile1.status !== 'APPROVED' || profile1.deletedAt) {
    throw new AppError(
      422,
      'PROFILE1_NOT_ELIGIBLE',
      'Profile 1 is not approved or does not exist',
    );
  }

  if (!profile2 || profile2.status !== 'APPROVED' || profile2.deletedAt) {
    throw new AppError(
      422,
      'PROFILE2_NOT_ELIGIBLE',
      'Profile 2 is not approved or does not exist',
    );
  }

  if (profile1.id === profile2.id) {
    throw new AppError(422, 'SAME_PROFILE', 'Cannot create an alliance between the same profile');
  }

  // H-06: Church membership check — the creating pastor must belong to one of the two churches
  // Super admins are exempt from this check (they have no churchId)
  const creatingUser = await prisma.user.findUnique({
    where: { id: creatingUserId },
    select: { churchId: true, role: true },
  });

  const isInvolved =
    creatingUser?.churchId === profile1.churchId ||
    creatingUser?.churchId === profile2.churchId;

  if (!isInvolved && creatingUser?.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You must belong to one of the two churches involved to initiate this alliance',
    );
  }

  // Check for existing active alliance between these two profiles
  const existing = await prisma.alliance.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [
        { profile1Id: data.profile1Id, profile2Id: data.profile2Id },
        { profile1Id: data.profile2Id, profile2Id: data.profile1Id },
      ],
    },
  });

  if (existing) {
    throw new AppError(
      409,
      'ALLIANCE_EXISTS',
      'An active alliance already exists between these two profiles',
    );
  }

  const alliance = await prisma.$transaction(async (tx) => {
    const created = await tx.alliance.create({
      data: {
        profile1Id: data.profile1Id,
        profile2Id: data.profile2Id,
        church1Id: profile1.churchId,
        church2Id: profile2.churchId,
        stage: 1,
        status: 'ACTIVE',
      },
    });

    // Add initial note if provided
    if (data.note) {
      await tx.allianceNote.create({
        data: {
          allianceId: created.id,
          authorId: creatingUserId,
          content: data.note,
        },
      });
    }

    return created;
  });

  logger.info(
    `Alliance created: ${alliance.id} profiles=${data.profile1Id}/${data.profile2Id} by user=${creatingUserId}`,
  );

  // Trigger interest notification (non-blocking)
  notifyNewInterest(alliance.id).catch((err) =>
    logger.error('notifyNewInterest failed:', err),
  );

  return alliance;
}

// ─── List alliances ───────────────────────────────────────────
export async function listAlliances(
  userId: string,
  userRole: UserRole,
  filters: ListAlliancesFilters,
): Promise<ListAlliancesResult> {
  const { status, stage, page, limit } = filters;

  const baseWhere: Record<string, unknown> = {};

  if (status) baseWhere['status'] = status;
  if (stage !== undefined) baseWhere['stage'] = stage;

  // Non-admin users only see alliances involving their own church's profiles
  let where = baseWhere;

  if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.CHURCH_ADMIN) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const churchId = user?.churchId;

    if (!churchId) {
      return { items: [], meta: paginate(0, page, limit) };
    }

    where = {
      ...baseWhere,
      OR: [{ church1Id: churchId }, { church2Id: churchId }],
    };
  }

  const [items, total] = await prisma.$transaction([
    prisma.alliance.findMany({
      where,
      include: {
        profile1: { select: { id: true, fullName: true, age: true, city: true, seeking: true } },
        profile2: { select: { id: true, fullName: true, age: true, city: true, seeking: true } },
        church1: { select: { id: true, name: true, denomination: true } },
        church2: { select: { id: true, name: true, denomination: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.alliance.count({ where }),
  ]);

  return { items, meta: paginate(total, page, limit) };
}

// ─── Get alliance (with full relations) ──────────────────────
export async function getAlliance(id: string): Promise<AllianceWithRelations> {
  const alliance = await prisma.alliance.findUnique({
    where: { id },
    include: {
      profile1: { include: { church: true } },
      profile2: { include: { church: true } },
      church1: true,
      church2: true,
      notes: {
        include: { author: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!alliance) {
    throw new AppError(404, 'ALLIANCE_NOT_FOUND', `Alliance ${id} not found`);
  }

  return alliance;
}

// ─── Advance alliance ─────────────────────────────────────────
export async function advanceAlliance(
  id: string,
  data: AdvanceAllianceInput,
  userId: string,
): Promise<Alliance> {
  const alliance = await prisma.alliance.findUnique({
    where: { id },
    include: { counsellingSessions: true },
  });

  if (!alliance) {
    throw new AppError(404, 'ALLIANCE_NOT_FOUND', `Alliance ${id} not found`);
  }

  if (alliance.status !== 'ACTIVE') {
    throw new AppError(422, 'ALLIANCE_NOT_ACTIVE', 'Cannot advance a non-active alliance');
  }

  if (alliance.stage >= MAX_STAGE) {
    throw new AppError(422, 'MAX_STAGE_REACHED', `Alliance is already at maximum stage ${MAX_STAGE}`);
  }

  const nextStage = alliance.stage + 1;

  // Stage 4 (Counselling): require at least one counselling session registered
  if (nextStage === COUNSELLING_STAGE) {
    if (alliance.counsellingSessions.length === 0) {
      throw new AppError(
        422,
        'NO_COUNSELLING_SESSIONS',
        'At least one counselling session must be registered before advancing to Counselling stage',
      );
    }
  }

  // Stage 5 (Engagement): require all 6 counselling sessions COMPLETED
  if (nextStage === MAX_STAGE) {
    const completedSessions = alliance.counsellingSessions.filter(
      (s) => s.status === 'COMPLETED',
    );

    if (completedSessions.length < REQUIRED_COUNSELLING_SESSIONS) {
      throw new AppError(
        422,
        'COUNSELLING_INCOMPLETE',
        `All ${REQUIRED_COUNSELLING_SESSIONS} counselling sessions must be completed before engagement. ` +
          `Completed: ${completedSessions.length}/${REQUIRED_COUNSELLING_SESSIONS}`,
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const advanced = await tx.alliance.update({
      where: { id },
      data: { stage: nextStage },
    });

    // Add required note
    await tx.allianceNote.create({
      data: {
        allianceId: id,
        authorId: userId,
        content: data.note,
      },
    });

    return advanced;
  });

  logger.info(`Alliance ${id} advanced to stage ${nextStage} by user=${userId}`);

  // Emit real-time update to both pastors
  const profiles = await prisma.alliance.findUnique({
    where: { id },
    select: {
      profile1: { select: { pastorId: true } },
      profile2: { select: { pastorId: true } },
    },
  });

  if (profiles) {
    const pastorIds = [
      ...new Set([profiles.profile1.pastorId, profiles.profile2.pastorId]),
    ];
    for (const pastorId of pastorIds) {
      emitToUser(pastorId, 'alliance:updated', { allianceId: id, stage: nextStage });
    }
  }

  // Send notifications (non-blocking)
  notifyAllianceAdvanced(id, nextStage).catch((err) =>
    logger.error('notifyAllianceAdvanced failed:', err),
  );

  return updated;
}

// ─── Dissolve alliance ────────────────────────────────────────
export async function dissolveAlliance(id: string, userId: string): Promise<Alliance> {
  const alliance = await prisma.alliance.findUnique({ where: { id } });

  if (!alliance) {
    throw new AppError(404, 'ALLIANCE_NOT_FOUND', `Alliance ${id} not found`);
  }

  if (alliance.status === 'DISSOLVED') {
    throw new AppError(409, 'ALREADY_DISSOLVED', 'Alliance is already dissolved');
  }

  const updated = await prisma.alliance.update({
    where: { id },
    data: {
      status: 'DISSOLVED',
      dissolvedAt: new Date(),
      dissolvedReason: null, // No reason stored per BRD
    },
  });

  // Return both profiles to searchable — profiles retain APPROVED status
  // No profile status change needed; dissolving the alliance is sufficient

  logger.info(`Alliance dissolved: ${id} by user=${userId}`);

  return updated;
}

// ─── Add note ─────────────────────────────────────────────────
export async function addNote(
  allianceId: string,
  authorId: string,
  content: string,
): Promise<AllianceNote> {
  // Verify alliance exists
  const alliance = await prisma.alliance.findUnique({ where: { id: allianceId } });

  if (!alliance) {
    throw new AppError(404, 'ALLIANCE_NOT_FOUND', `Alliance ${allianceId} not found`);
  }

  const note = await prisma.allianceNote.create({
    data: {
      allianceId,
      authorId,
      content,
    },
    include: {
      author: { select: { id: true, email: true, role: true } },
    },
  });

  return note;
}

// ─── Get notes ────────────────────────────────────────────────
export async function getNotes(allianceId: string): Promise<AllianceNote[]> {
  const alliance = await prisma.alliance.findUnique({ where: { id: allianceId } });

  if (!alliance) {
    throw new AppError(404, 'ALLIANCE_NOT_FOUND', `Alliance ${allianceId} not found`);
  }

  return prisma.allianceNote.findMany({
    where: { allianceId },
    include: {
      author: { select: { id: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}
