// ============================================================
// OneFlesh — Counselling Service
// ============================================================

import PDFDocument from 'pdfkit';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';
import { paginate } from '../../utils/response.js';
import { generateCounsellingQuestions } from '../ai/ai.service.js';
import { COUNSELLING_SESSIONS } from '@oneflesh/shared';
import type { CreateCounsellingInput, CompleteSessionInput, PaginationMeta } from '@oneflesh/shared';
import { UserRole, SessionStatus } from '@oneflesh/shared';
import type { CounsellingSession } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────

interface ListSessionsResult {
  items: CounsellingSession[];
  meta: PaginationMeta;
}

// ─── Register couple (creates 6 sessions) ────────────────────

export async function registerCouple(data: CreateCounsellingInput): Promise<CounsellingSession[]> {
  const alliance = await prisma.alliance.findUnique({
    where: { id: data.allianceId },
    include: {
      church1: true,
      church2: true,
    },
  });

  if (!alliance) {
    throw new AppError(404, 'ALLIANCE_NOT_FOUND', `Alliance ${data.allianceId} not found`);
  }

  if (alliance.stage < 3) {
    throw new AppError(
      422,
      'ALLIANCE_STAGE_TOO_LOW',
      `Alliance must be at stage 3 or higher to register counselling. Current stage: ${alliance.stage}`,
    );
  }

  // Check if sessions already exist for this alliance
  const existingCount = await prisma.counsellingSession.count({
    where: { allianceId: data.allianceId },
  });

  if (existingCount > 0) {
    throw new AppError(
      409,
      'SESSIONS_ALREADY_REGISTERED',
      `Counselling sessions are already registered for alliance ${data.allianceId}`,
    );
  }

  // Create all 6 sessions in a transaction
  const sessions = await prisma.$transaction(async (tx) => {
    const created: CounsellingSession[] = [];

    for (let sessionNumber = 1; sessionNumber <= 6; sessionNumber++) {
      const session = await tx.counsellingSession.create({
        data: {
          allianceId: data.allianceId,
          groomName: data.groomName,
          brideName: data.brideName,
          groomChurch: data.groomChurch,
          brideChurch: data.brideChurch,
          counsellorName: data.counsellorName,
          sessionNumber,
          sessionDate: data.sessionDate ? new Date(data.sessionDate) : null,
          format: data.format,
          status: 'SCHEDULED',
        },
      });
      created.push(session);
    }

    return created;
  });

  logger.info(
    `Counselling sessions registered for alliance ${data.allianceId}: ${sessions.length} sessions created`,
  );

  return sessions;
}

// ─── List sessions ────────────────────────────────────────────

export async function listSessions(
  userId: string,
  userRole: UserRole,
  page: number,
  limit: number,
): Promise<ListSessionsResult> {
  let where: Record<string, unknown> = {};

  if (userRole !== UserRole.SUPER_ADMIN) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { churchId: true },
    });

    if (!user?.churchId) {
      return { items: [], meta: paginate(0, page, limit) };
    }

    // Pastor sees only sessions for alliances involving their church
    where = {
      alliance: {
        OR: [
          { church1Id: user.churchId },
          { church2Id: user.churchId },
        ],
      },
    };
  }

  const [items, total] = await prisma.$transaction([
    prisma.counsellingSession.findMany({
      where,
      include: {
        alliance: {
          include: {
            church1: { select: { id: true, name: true } },
            church2: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.counsellingSession.count({ where }),
  ]);

  return { items, meta: paginate(total, page, limit) };
}

// ─── Get session ──────────────────────────────────────────────

export async function getSession(id: string): Promise<CounsellingSession> {
  const session = await prisma.counsellingSession.findUnique({
    where: { id },
    include: {
      alliance: {
        include: {
          profile1: { select: { id: true, fullName: true, seeking: true } },
          profile2: { select: { id: true, fullName: true, seeking: true } },
          church1: true,
          church2: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', `Counselling session ${id} not found`);
  }

  return session;
}

// ─── Complete session ─────────────────────────────────────────

export async function completeSession(
  id: string,
  data: CompleteSessionInput,
  userId: string,
): Promise<CounsellingSession> {
  const session = await prisma.counsellingSession.findUnique({
    where: { id },
    include: {
      alliance: {
        include: {
          church1: true,
          church2: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', `Counselling session ${id} not found`);
  }

  if (session.status === SessionStatus.COMPLETED) {
    throw new AppError(409, 'SESSION_ALREADY_COMPLETED', 'Session is already completed');
  }

  if (session.status === SessionStatus.CANCELLED) {
    throw new AppError(422, 'SESSION_CANCELLED', 'Cannot complete a cancelled session');
  }

  // Verify pastor belongs to one of the alliance's churches
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { churchId: true },
  });

  const alliance = session.alliance as typeof session.alliance & {
    church1: { id: string };
    church2: { id: string };
  };

  if (
    user?.churchId &&
    user.churchId !== alliance.church1Id &&
    user.churchId !== alliance.church2Id
  ) {
    throw new AppError(
      403,
      'NOT_ALLIANCE_CHURCH',
      'You can only complete sessions for alliances involving your church',
    );
  }

  const updated = await prisma.counsellingSession.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: data.completedAt ? new Date(data.completedAt) : new Date(),
      notes: data.notes ?? null,
    },
  });

  logger.info(`Session ${id} (session #${session.sessionNumber}) completed by user ${userId}`);

  return updated;
}

// ─── Generate certificate ─────────────────────────────────────

export async function generateCertificate(id: string): Promise<Buffer> {
  // id here is either a session ID for session 6, or an allianceId
  // We treat it as the 6th session ID
  const session = await prisma.counsellingSession.findUnique({
    where: { id },
    include: {
      alliance: {
        include: {
          church1: true,
          church2: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', `Counselling session ${id} not found`);
  }

  if (session.sessionNumber !== 6) {
    throw new AppError(
      422,
      'NOT_FINAL_SESSION',
      'Certificate can only be generated for session 6',
    );
  }

  if (session.status !== SessionStatus.COMPLETED) {
    throw new AppError(
      422,
      'SESSION_NOT_COMPLETED',
      'The 6th session must be completed before generating a certificate',
    );
  }

  // Verify all 6 sessions are completed
  const allSessions = await prisma.counsellingSession.findMany({
    where: { allianceId: session.allianceId },
    orderBy: { sessionNumber: 'asc' },
  });

  const completedCount = allSessions.filter((s) => s.status === 'COMPLETED').length;
  if (completedCount < 6) {
    throw new AppError(
      422,
      'COUNSELLING_INCOMPLETE',
      `All 6 sessions must be completed. Completed: ${completedCount}/6`,
    );
  }

  const alliance = session.alliance as typeof session.alliance & {
    church1: { name: string };
    church2: { name: string };
  };

  const completionDate = session.completedAt
    ? session.completedAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // Build PDF
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Background — cream
    doc.rect(0, 0, pageWidth, pageHeight).fill('#fff9f4');

    // Decorative border — double rule in crimson
    const margin = 20;
    doc
      .rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)
      .lineWidth(3)
      .stroke('#4a0a12');
    doc
      .rect(margin + 6, margin + 6, pageWidth - (margin + 6) * 2, pageHeight - (margin + 6) * 2)
      .lineWidth(1)
      .stroke('#c9a84c');

    // Header — OneFlesh branding
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#c9a84c')
      .text('ONE FLESH', 0, 50, { align: 'center', characterSpacing: 6 });

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#7a5a5e')
      .text('Reformed Church Matrimonial Platform', 0, 65, { align: 'center', characterSpacing: 2 });

    // Thin gold rule
    const ruleY = 82;
    doc.moveTo(80, ruleY).lineTo(pageWidth - 80, ruleY).lineWidth(0.5).stroke('#c9a84c');

    // Certificate title
    doc
      .font('Helvetica-Bold')
      .fontSize(26)
      .fillColor('#4a0a12')
      .text('Certificate of Pre-Marital Counselling', 0, 100, { align: 'center' });

    // Sub-heading
    doc
      .font('Helvetica-Oblique')
      .fontSize(11)
      .fillColor('#7a5a5e')
      .text('"Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh." — Genesis 2:24', 80, 138, {
        align: 'center',
        width: pageWidth - 160,
      });

    // Horizontal rule
    doc.moveTo(80, 168).lineTo(pageWidth - 80, 168).lineWidth(0.5).stroke('#c9a84c');

    // Body text
    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor('#3d1a1e')
      .text('This is to certify that', 0, 186, { align: 'center' });

    // Names
    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#4a0a12')
      .text(`${session.groomName}  &  ${session.brideName}`, 0, 208, { align: 'center' });

    // Church names
    doc
      .font('Helvetica-Oblique')
      .fontSize(11)
      .fillColor('#7a5a5e')
      .text(
        `${alliance.church1.name}  ·  ${alliance.church2.name}`,
        0,
        238,
        { align: 'center' },
      );

    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor('#3d1a1e')
      .text(
        'have successfully completed all six sessions of pre-marital counselling',
        80,
        262,
        { align: 'center', width: pageWidth - 160 },
      );

    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor('#3d1a1e')
      .text('as prescribed by the OneFlesh Reformed Church Matrimonial Platform,', 80, 282, {
        align: 'center',
        width: pageWidth - 160,
      });

    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor('#3d1a1e')
      .text('covering the covenantal foundations of Christian marriage.', 80, 302, {
        align: 'center',
        width: pageWidth - 160,
      });

    // Counsellor
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor('#3d1a1e')
      .text(`Counselled by: `, 80, 332, { continued: true, align: 'left' })
      .font('Helvetica-Bold')
      .text(session.counsellorName);

    // Completion date
    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor('#3d1a1e')
      .text(`Completed on: `, pageWidth / 2, 332, { continued: true })
      .font('Helvetica-Bold')
      .text(completionDate);

    // Bottom rule
    const bottomRuleY = pageHeight - 80;
    doc.moveTo(80, bottomRuleY).lineTo(pageWidth - 80, bottomRuleY).lineWidth(0.5).stroke('#c9a84c');

    // Footer
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#7a5a5e')
      .text(
        'This certificate is issued by the OneFlesh platform. All alliances are pastoral-approved.',
        0,
        bottomRuleY + 10,
        { align: 'center' },
      );

    doc.end();
  });
}

// ─── Get session questions via AI ────────────────────────────

export async function getSessionQuestions(id: string, userId: string): Promise<string[]> {
  const session = await prisma.counsellingSession.findUnique({
    where: { id },
  });

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', `Counselling session ${id} not found`);
  }

  const sessionDef = COUNSELLING_SESSIONS.find(
    (s) => s.session === session.sessionNumber,
  );

  if (!sessionDef) {
    throw new AppError(
      422,
      'SESSION_DEF_NOT_FOUND',
      `No session definition found for session number ${session.sessionNumber}`,
    );
  }

  const questions = await generateCounsellingQuestions(
    session.sessionNumber,
    sessionDef.topic,
    sessionDef.scripture,
    userId,
  );

  return questions;
}
