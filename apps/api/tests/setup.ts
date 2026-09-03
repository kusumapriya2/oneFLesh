// ============================================================
// OneFlesh API — Jest Global Test Setup
// ============================================================

import { prisma } from '../src/config/database.js';
import { redis } from '../src/config/redis.js';

// ── Before all tests ───────────────────────────────────────
beforeAll(async () => {
  // Verify DB connection
  await prisma.$connect();
});

// ── After all tests ────────────────────────────────────────
afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});
