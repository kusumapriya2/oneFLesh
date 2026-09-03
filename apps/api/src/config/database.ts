// ============================================================
// OneFlesh — Prisma Database Client
// ============================================================

import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Log slow queries in development
prisma.$on('query', (e) => {
  if (e.duration > 200) {
    logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
