// ============================================================
// OneFlesh — Dashboard Service
// ============================================================

import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import type { Notification, AuditLog, Profile, Alliance, CounsellingSession } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────

interface PastorDashboard {
  activeProfiles: number;
  alliancesInProgress: number;
  pendingInterests: number;
  upcomingSessions: CounsellingSession[];
  recentNotifications: Notification[];
  myProfiles: Profile[];
  activeAlliances: Alliance[];
}

interface AdminDashboard {
  totalChurches: number;
  totalProfiles: number;
  totalAlliances: number;
  totalVendors: number;
  monthlyActivePastors: number;
  pendingChurchApplications: number;
  pendingVendorApplications: number;
  aiQueriesThisMonth: number;
  recentAuditLogs: AuditLog[];
}

// ─── Pastor dashboard ─────────────────────────────────────────

export async function getPastorDashboard(
  userId: string,
  churchId: string,
): Promise<PastorDashboard> {
  logger.debug(`Building pastor dashboard for user=${userId} church=${churchId}`);

  const [
    activeProfiles,
    alliancesInProgress,
    pendingInterests,
    upcomingSessions,
    recentNotifications,
    myProfiles,
    activeAlliances,
  ] = await Promise.all([
    // Active (APPROVED) profiles belonging to this church
    prisma.profile.count({
      where: {
        churchId,
        status: 'APPROVED',
        deletedAt: null,
      },
    }),

    // Active alliances involving this church
    prisma.alliance.count({
      where: {
        status: 'ACTIVE',
        OR: [{ church1Id: churchId }, { church2Id: churchId }],
      },
    }),

    // Pending interests: alliances at stage 1 (INTEREST) involving this church
    prisma.alliance.count({
      where: {
        stage: 1,
        status: 'ACTIVE',
        OR: [{ church1Id: churchId }, { church2Id: churchId }],
      },
    }),

    // Upcoming scheduled counselling sessions for alliances involving this church
    prisma.counsellingSession.findMany({
      where: {
        status: 'SCHEDULED',
        alliance: {
          OR: [{ church1Id: churchId }, { church2Id: churchId }],
        },
      },
      orderBy: { sessionDate: 'asc' },
      take: 10,
    }),

    // Recent notifications for this user (last 10)
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    // Profiles managed by this pastor
    prisma.profile.findMany({
      where: {
        pastorId: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        age: true,
        city: true,
        state: true,
        seeking: true,
        status: true,
        photoUrl: true,
        churchId: true,
        pastorId: true,
        education: true,
        occupation: true,
        testimony: true,
        ministryInvolvement: true,
        pastorRecommendation: true,
        endorsements: true,
        fatherName: true,
        yearsInChurch: true,
        deletedAt: true,
        hardDeleteAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),

    // Active alliances involving this church with profile/church details
    prisma.alliance.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ church1Id: churchId }, { church2Id: churchId }],
      },
      include: {
        profile1: { select: { id: true, fullName: true, age: true, seeking: true } },
        profile2: { select: { id: true, fullName: true, age: true, seeking: true } },
        church1: { select: { id: true, name: true } },
        church2: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
  ]);

  return {
    activeProfiles,
    alliancesInProgress,
    pendingInterests,
    upcomingSessions: upcomingSessions as CounsellingSession[],
    recentNotifications,
    myProfiles: myProfiles as Profile[],
    activeAlliances: activeAlliances as Alliance[],
  };
}

// ─── Public stats (no auth — home page hero) ──────────────────

export interface PublicStats {
  totalChurches: number;
  totalProfiles: number;
  totalAlliances: number;
  totalVendors: number;
}

export async function getPublicStats(): Promise<PublicStats> {
  const [totalChurches, totalProfiles, totalAlliances, totalVendors] = await Promise.all([
    prisma.church.count({ where: { status: 'APPROVED' } }),
    prisma.profile.count({ where: { status: 'APPROVED', deletedAt: null } }),
    prisma.alliance.count(),
    prisma.vendor.count({ where: { status: 'APPROVED', deletedAt: null } }),
  ]);

  return { totalChurches, totalProfiles, totalAlliances, totalVendors };
}

// ─── Admin dashboard ──────────────────────────────────────────

export async function getAdminDashboard(): Promise<AdminDashboard> {
  logger.debug('Building admin dashboard');

  // Monthly boundary: start of this calendar month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalChurches,
    totalProfiles,
    totalAlliances,
    totalVendors,
    monthlyActivePastors,
    pendingChurchApplications,
    pendingVendorApplications,
    aiQueriesThisMonth,
    recentAuditLogs,
  ] = await Promise.all([
    // Total APPROVED churches
    prisma.church.count({ where: { status: 'APPROVED' } }),

    // Total active profiles
    prisma.profile.count({ where: { status: 'APPROVED', deletedAt: null } }),

    // Total alliances (all time)
    prisma.alliance.count(),

    // Total approved vendors
    prisma.vendor.count({ where: { status: 'APPROVED', deletedAt: null } }),

    // Monthly active pastors: distinct users who have logged in this month
    prisma.user.count({
      where: {
        lastLoginAt: { gte: monthStart },
        deletedAt: null,
      },
    }),

    // Pending church applications
    prisma.church.count({ where: { status: 'PENDING' } }),

    // Pending vendor applications
    prisma.vendor.count({ where: { status: 'PENDING', deletedAt: null } }),

    // AI queries this month
    prisma.aIInteraction.count({
      where: { createdAt: { gte: monthStart } },
    }),

    // Recent audit logs (last 20)
    prisma.auditLog.findMany({
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return {
    totalChurches,
    totalProfiles,
    totalAlliances,
    totalVendors,
    monthlyActivePastors,
    pendingChurchApplications,
    pendingVendorApplications,
    aiQueriesThisMonth,
    recentAuditLogs: recentAuditLogs as AuditLog[],
  };
}
