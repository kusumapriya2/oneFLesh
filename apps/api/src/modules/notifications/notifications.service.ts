// ============================================================
// OneFlesh — Notifications Service
// Delivery channels: in-app (DB) · WebSocket · Email · WhatsApp
// ============================================================

import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import { sendEmail, EmailTemplates } from '../../utils/email.js';
import { sendWhatsApp, WhatsAppTemplates } from '../../utils/whatsapp.js';
import { emitToUser } from '../../socket/index.js';
import { NotificationType } from '@oneflesh/shared';
import type { Notification } from '@oneflesh/shared';

// ─── Core: persist + push real-time ───────────────────────────

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  relatedEntityType?: string,
  relatedEntityId?: string,
): Promise<Notification> {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      relatedEntityType: relatedEntityType ?? null,
      relatedEntityId: relatedEntityId ?? null,
    },
  });

  // Push real-time event to connected socket client
  emitToUser(userId, 'notification:new', {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
    createdAt: notification.createdAt,
  });

  return notification as Notification;
}

// ─── Private helpers ──────────────────────────────────────────

/**
 * Send WhatsApp to a pastor identified by their church.
 * Looks up the church's pastorPhone and sends; silently no-ops if phone absent.
 */
async function whatsappChurchPastor(pastorPhone: string | undefined | null, message: string): Promise<void> {
  if (!pastorPhone) return;
  await sendWhatsApp(pastorPhone, message);
}

// ─── NEW INTEREST (alliance created) ─────────────────────────
// Notifies: receiving pastor (profile2's church)
// Channels: in-app · email · WhatsApp

export async function notifyNewInterest(allianceId: string): Promise<void> {
  try {
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId },
      include: {
        profile1: { include: { pastor: true, church: true } },
        profile2: { include: { pastor: true, church: true } },
      },
    });

    if (!alliance) {
      logger.warn(`notifyNewInterest: alliance ${allianceId} not found`);
      return;
    }

    const { profile1, profile2 } = alliance;
    const expressedByChurchName = profile1.church?.name ?? 'A church';

    // In-app
    await createNotification(
      profile2.pastorId,
      NotificationType.INTEREST,
      'New Interest Received',
      `${expressedByChurchName} has expressed interest for ${profile2.fullName}.`,
      'Alliance',
      allianceId,
    );

    // Email
    const receivingPastorEmail = profile2.church?.pastorEmail;
    if (receivingPastorEmail) {
      await sendEmail({
        to: receivingPastorEmail,
        subject: 'New Interest Received — OneFlesh',
        html: EmailTemplates.newInterest(
          profile2.church?.pastorName ?? 'Pastor',
          profile2.fullName,
          expressedByChurchName,
        ),
      });
    }

    // WhatsApp
    await whatsappChurchPastor(
      profile2.church?.pastorPhone,
      WhatsAppTemplates.newInterest(profile2.fullName, expressedByChurchName),
    );
  } catch (err) {
    logger.error('notifyNewInterest failed:', err);
  }
}

// ─── ALLIANCE ADVANCED ────────────────────────────────────────
// Notifies: both pastors
// Channels: in-app · socket · email · WhatsApp

export async function notifyAllianceAdvanced(allianceId: string, stage: number): Promise<void> {
  const STAGE_LABELS: Record<number, string> = {
    1: 'Initial Interest',
    2: 'Families Introduced',
    3: 'Meetings Begun',
    4: 'Counselling',
    5: 'Engagement',
  };

  try {
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId },
      include: {
        profile1: { include: { pastor: true, church: true } },
        profile2: { include: { pastor: true, church: true } },
      },
    });

    if (!alliance) {
      logger.warn(`notifyAllianceAdvanced: alliance ${allianceId} not found`);
      return;
    }

    const stageLabel = STAGE_LABELS[stage] ?? `Stage ${stage}`;
    const parties = `${alliance.profile1.fullName} & ${alliance.profile2.fullName}`;
    const notifBody = `Alliance for ${parties} has advanced to Stage ${stage}: ${stageLabel}.`;

    // In-app for both pastors
    const pastorIds = [...new Set([alliance.profile1.pastorId, alliance.profile2.pastorId])];
    for (const pastorId of pastorIds) {
      await createNotification(
        pastorId,
        NotificationType.ALLIANCE_UPDATE,
        `Alliance Advanced — Stage ${stage}`,
        notifBody,
        'Alliance',
        allianceId,
      );
    }

    // Socket
    emitToUser(alliance.profile1.pastorId, 'alliance:updated', { allianceId, stage, stageLabel });
    if (alliance.profile2.pastorId !== alliance.profile1.pastorId) {
      emitToUser(alliance.profile2.pastorId, 'alliance:updated', { allianceId, stage, stageLabel });
    }

    // Email — both pastors
    const emails = [
      alliance.profile1.church?.pastorEmail,
      alliance.profile2.church?.pastorEmail,
    ].filter((e): e is string => Boolean(e));

    for (const email of emails) {
      await sendEmail({
        to: email,
        subject: `Alliance Updated — Stage ${stage}: ${stageLabel} — OneFlesh`,
        html: EmailTemplates.allianceAdvanced(stage, stageLabel, parties),
      });
    }

    // WhatsApp — both pastors
    const whatsAppMsg = WhatsAppTemplates.allianceAdvanced(stage, stageLabel, parties);
    await Promise.all([
      whatsappChurchPastor(alliance.profile1.church?.pastorPhone, whatsAppMsg),
      alliance.profile2.church?.pastorPhone !== alliance.profile1.church?.pastorPhone
        ? whatsappChurchPastor(alliance.profile2.church?.pastorPhone, whatsAppMsg)
        : Promise.resolve(),
    ]);
  } catch (err) {
    logger.error('notifyAllianceAdvanced failed:', err);
  }
}

// ─── ALLIANCE DISSOLVED ───────────────────────────────────────
// Notifies: both pastors
// Channels: in-app · WhatsApp

export async function notifyAllianceDissolved(allianceId: string): Promise<void> {
  try {
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId },
      include: {
        profile1: { include: { church: true } },
        profile2: { include: { church: true } },
      },
    });

    if (!alliance) {
      logger.warn(`notifyAllianceDissolved: alliance ${allianceId} not found`);
      return;
    }

    const parties = `${alliance.profile1.fullName} & ${alliance.profile2.fullName}`;
    const notifBody = `The alliance for ${parties} has been dissolved.`;

    const pastorIds = [...new Set([alliance.profile1.pastorId, alliance.profile2.pastorId])];
    for (const pastorId of pastorIds) {
      await createNotification(
        pastorId,
        NotificationType.ALLIANCE_DISSOLVED,
        'Alliance Dissolved',
        notifBody,
        'Alliance',
        allianceId,
      );
    }

    // WhatsApp — both pastors
    const whatsAppMsg = WhatsAppTemplates.allianceDissolved(parties);
    await Promise.all([
      whatsappChurchPastor(alliance.profile1.church?.pastorPhone, whatsAppMsg),
      alliance.profile2.church?.pastorPhone !== alliance.profile1.church?.pastorPhone
        ? whatsappChurchPastor(alliance.profile2.church?.pastorPhone, whatsAppMsg)
        : Promise.resolve(),
    ]);
  } catch (err) {
    logger.error('notifyAllianceDissolved failed:', err);
  }
}

// ─── PROFILE APPROVED ─────────────────────────────────────────
// Notifies: profile's pastor
// Channels: in-app · WhatsApp

export async function notifyProfileApproved(profileId: string): Promise<void> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { church: true },
    });

    if (!profile) {
      logger.warn(`notifyProfileApproved: profile ${profileId} not found`);
      return;
    }

    await createNotification(
      profile.pastorId,
      NotificationType.PROFILE_APPROVED,
      'Profile Approved',
      `The profile for ${profile.fullName} has been approved and is now visible to other churches.`,
      'Profile',
      profileId,
    );

    // WhatsApp
    await whatsappChurchPastor(
      profile.church?.pastorPhone,
      WhatsAppTemplates.profileApproved(profile.fullName),
    );
  } catch (err) {
    logger.error('notifyProfileApproved failed:', err);
  }
}

// ─── PROFILE REJECTED ─────────────────────────────────────────
// Notifies: profile's pastor
// Channels: in-app · WhatsApp

export async function notifyProfileRejected(profileId: string): Promise<void> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { church: true },
    });

    if (!profile) {
      logger.warn(`notifyProfileRejected: profile ${profileId} not found`);
      return;
    }

    await createNotification(
      profile.pastorId,
      NotificationType.PROFILE_REJECTED,
      'Profile Could Not Be Approved',
      `The profile for ${profile.fullName} could not be approved at this time. Please log in for details.`,
      'Profile',
      profileId,
    );

    // WhatsApp
    await whatsappChurchPastor(
      profile.church?.pastorPhone,
      WhatsAppTemplates.profileRejected(profile.fullName),
    );
  } catch (err) {
    logger.error('notifyProfileRejected failed:', err);
  }
}

// ─── CHURCH APPROVED ─────────────────────────────────────────
// Notifies: church's pastor user
// Channels: in-app · email · WhatsApp

export async function notifyChurchApproved(churchId: string): Promise<void> {
  try {
    const church = await prisma.church.findUnique({ where: { id: churchId } });

    if (!church) {
      logger.warn(`notifyChurchApproved: church ${churchId} not found`);
      return;
    }

    const pastorUser = await prisma.user.findFirst({
      where: { churchId, deletedAt: null },
    });

    if (pastorUser) {
      await createNotification(
        pastorUser.id,
        NotificationType.CHURCH_APPROVED,
        'Church Application Approved',
        `Your church "${church.name}" has been approved. You may now create candidate profiles.`,
        'Church',
        churchId,
      );
    }

    // Email
    await sendEmail({
      to: church.pastorEmail,
      subject: 'Your Church Application Has Been Approved — OneFlesh',
      html: `
        <p>Dear ${church.pastorName},</p>
        <p>We are pleased to inform you that <strong>${church.name}</strong> has been approved on the OneFlesh platform.</p>
        <p>You can now create profiles for candidates in your congregation, search for matches, and manage alliances through the pastor dashboard.</p>
        <p style="color:#6b0f1a;font-style:italic;">"He who finds a wife finds a good thing and obtains favour from the LORD." — Proverbs 18:22</p>
      `,
    });

    // WhatsApp
    await whatsappChurchPastor(
      church.pastorPhone,
      WhatsAppTemplates.churchApproved(church.name),
    );
  } catch (err) {
    logger.error('notifyChurchApproved failed:', err);
  }
}

// ─── CHURCH REJECTED ─────────────────────────────────────────
// Notifies: church's pastor user
// Channels: in-app · email (with reason) · WhatsApp (no reason — see security note)
//
// Security: The rejection reason is deliberately omitted from the WhatsApp message
// because it may contain sensitive admin notes. The full reason is sent via email only.

export async function notifyChurchRejected(churchId: string, reason: string): Promise<void> {
  try {
    const church = await prisma.church.findUnique({ where: { id: churchId } });

    if (!church) {
      logger.warn(`notifyChurchRejected: church ${churchId} not found`);
      return;
    }

    const pastorUser = await prisma.user.findFirst({
      where: { churchId, deletedAt: null },
    });

    if (pastorUser) {
      await createNotification(
        pastorUser.id,
        NotificationType.CHURCH_REJECTED,
        'Church Application Update',
        `Your application for "${church.name}" could not be approved. Please check your email for details.`,
        'Church',
        churchId,
      );
    }

    // Email — includes full reason
    await sendEmail({
      to: church.pastorEmail,
      subject: 'OneFlesh Church Application Update',
      html: `
        <p>Dear ${church.pastorName},</p>
        <p>Unfortunately, your church application for <strong>${church.name}</strong> could not be approved at this time.</p>
        <p><strong>Reason:</strong> ${reason.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        <p>Please contact us if you have questions.</p>
      `,
    }).catch((err) => logger.error('Church rejection email failed:', err));

    // WhatsApp — reason omitted intentionally (may contain sensitive admin notes)
    await whatsappChurchPastor(
      church.pastorPhone,
      WhatsAppTemplates.churchRejected(church.name),
    );
  } catch (err) {
    logger.error('notifyChurchRejected failed:', err);
  }
}

// ─── COUNSELLING SESSIONS SCHEDULED ──────────────────────────
// Notifies: the registering pastor (from their church)
// Channels: in-app · WhatsApp

export async function notifySessionsScheduled(
  allianceId: string,
  groomName: string,
  brideName: string,
  registeredByPastorId: string,
): Promise<void> {
  try {
    const pastor = await prisma.user.findUnique({
      where: { id: registeredByPastorId },
      include: { church: true },
    });

    if (!pastor) {
      logger.warn(`notifySessionsScheduled: pastor ${registeredByPastorId} not found`);
      return;
    }

    await createNotification(
      registeredByPastorId,
      NotificationType.SESSION_SCHEDULED,
      'Counselling Sessions Registered',
      `Pre-marital counselling sessions have been registered for ${groomName} & ${brideName}. Session 1 of 6 is ready.`,
      'Alliance',
      allianceId,
    );

    // WhatsApp
    await whatsappChurchPastor(
      pastor.church?.pastorPhone,
      WhatsAppTemplates.sessionScheduled(groomName, brideName),
    );
  } catch (err) {
    logger.error('notifySessionsScheduled failed:', err);
  }
}

// ─── COUNSELLING SESSION COMPLETED ───────────────────────────
// Notifies: the registering/counselling pastor (via alliance church1)
// Channels: in-app · WhatsApp

export async function notifySessionCompleted(sessionId: string): Promise<void> {
  try {
    const session = await prisma.counsellingSession.findUnique({
      where: { id: sessionId },
      include: {
        alliance: {
          include: {
            profile1: { include: { church: true } },
          },
        },
      },
    });

    if (!session) {
      logger.warn(`notifySessionCompleted: session ${sessionId} not found`);
      return;
    }

    const { groomName, brideName, sessionNumber } = session;
    const TOTAL_SESSIONS = 6;
    const notifBody =
      sessionNumber === TOTAL_SESSIONS
        ? `All ${TOTAL_SESSIONS} counselling sessions completed for ${groomName} & ${brideName}. The alliance may now advance to Stage 5.`
        : `Session ${sessionNumber} of ${TOTAL_SESSIONS} completed for ${groomName} & ${brideName}. ${TOTAL_SESSIONS - sessionNumber} remaining.`;

    await createNotification(
      session.alliance.profile1.pastorId,
      NotificationType.SESSION_COMPLETED,
      `Session ${sessionNumber} Completed`,
      notifBody,
      'CounsellingSession',
      sessionId,
    );

    // WhatsApp
    await whatsappChurchPastor(
      session.alliance.profile1.church?.pastorPhone,
      WhatsAppTemplates.sessionCompleted(groomName, brideName, sessionNumber, TOTAL_SESSIONS),
    );
  } catch (err) {
    logger.error('notifySessionCompleted failed:', err);
  }
}

// ─── COUNSELLING REMINDER ────────────────────────────────────
// Notifies: the counsellor's church (profile1 church)
// Channels: in-app · email · WhatsApp

export async function notifyCounsellingReminder(sessionId: string): Promise<void> {
  try {
    const session = await prisma.counsellingSession.findUnique({
      where: { id: sessionId },
      include: {
        alliance: {
          include: {
            profile1: { include: { church: true } },
          },
        },
      },
    });

    if (!session) {
      logger.warn(`notifyCounsellingReminder: session ${sessionId} not found`);
      return;
    }

    const { groomName, brideName, sessionNumber } = session;
    const dateStr = session.sessionDate
      ? new Date(session.sessionDate).toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'soon';

    const pastorId = session.alliance.profile1.pastorId;

    await createNotification(
      pastorId,
      NotificationType.COUNSELLING_REMINDER,
      `Session ${sessionNumber} Reminder`,
      `Counselling Session ${sessionNumber} for ${groomName} & ${brideName} is on ${dateStr}.`,
      'CounsellingSession',
      sessionId,
    );

    // Email
    const pastorEmail = session.alliance.profile1.church?.pastorEmail;
    if (pastorEmail) {
      await sendEmail({
        to: pastorEmail,
        subject: `Counselling Session ${sessionNumber} Reminder — OneFlesh`,
        html: EmailTemplates.counsellingReminder(groomName, brideName, sessionNumber, dateStr),
      });
    }

    // WhatsApp
    await whatsappChurchPastor(
      session.alliance.profile1.church?.pastorPhone,
      WhatsAppTemplates.counsellingReminder(groomName, brideName, sessionNumber, dateStr),
    );
  } catch (err) {
    logger.error('notifyCounsellingReminder failed:', err);
  }
}

// ─── VENDOR CONTACT ──────────────────────────────────────────
// Notifies: the vendor owner (if they have a user account)
// Channels: in-app · WhatsApp (email handled directly in vendors.service.ts)

export async function notifyVendorContact(
  vendorId: string,
  businessName: string,
  ownerUserId: string | null,
  requestingChurchName: string,
): Promise<void> {
  try {
    if (!ownerUserId) return;

    await createNotification(
      ownerUserId,
      NotificationType.VENDOR_CONTACT,
      'New Contact Request',
      `${requestingChurchName} is interested in your services (${businessName}).`,
      'Vendor',
      vendorId,
    );

    // Vendor owners may have their own phone — look up via the user record
    const owner = await prisma.user.findUnique({
      where: { id: ownerUserId },
      include: { church: true },
    });

    await whatsappChurchPastor(
      owner?.church?.pastorPhone,
      WhatsAppTemplates.vendorContact(businessName, requestingChurchName),
    );
  } catch (err) {
    logger.error('notifyVendorContact failed:', err);
  }
}

// ─── VENDOR APPROVED ─────────────────────────────────────────
// Notifies: vendor owner
// Channels: in-app · WhatsApp

export async function notifyVendorApproved(vendorId: string): Promise<void> {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor || !vendor.ownerUserId) return;

    await createNotification(
      vendor.ownerUserId,
      NotificationType.VENDOR_APPROVED,
      'Vendor Listing Approved',
      `Your vendor listing "${vendor.businessName}" has been approved and is now visible to pastors.`,
      'Vendor',
      vendorId,
    );

    // Look up owner's church phone for WhatsApp
    const owner = await prisma.user.findUnique({
      where: { id: vendor.ownerUserId },
      include: { church: true },
    });

    await whatsappChurchPastor(
      owner?.church?.pastorPhone,
      WhatsAppTemplates.vendorApproved(vendor.businessName),
    );
  } catch (err) {
    logger.error('notifyVendorApproved failed:', err);
  }
}
