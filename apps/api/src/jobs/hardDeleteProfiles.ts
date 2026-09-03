// ============================================================
// OneFlesh — Hard Delete Profiles Cron Job (H-04 fix)
//
// Profiles scheduled for deletion have `hardDeleteAt` set
// when `deleteProfile()` is called.  Without this job the
// field is written but never consumed — deleted profiles
// (including encrypted PII) remain in the DB indefinitely.
//
// Schedule: runs at midnight every day (00:00 server time)
// Env:      PROFILE_HARD_DELETE_DAYS controls the grace period
//           (default 30 days, set in env.ts)
// ============================================================

import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * Permanently delete all profiles whose grace period has expired.
 * Called by the cron schedule and can also be called directly in tests.
 */
export async function runHardDeleteProfiles(): Promise<void> {
  try {
    const result = await prisma.profile.deleteMany({
      where: {
        status: 'DELETED',
        hardDeleteAt: { lte: new Date() },
      },
    });

    if (result.count > 0) {
      logger.info(`[hardDeleteProfiles] Permanently deleted ${result.count} profile(s) past retention date`);
    } else {
      logger.debug('[hardDeleteProfiles] No profiles due for hard deletion');
    }
  } catch (err) {
    // Non-fatal — log and carry on; the job will retry on the next run
    logger.error('[hardDeleteProfiles] Job failed:', err);
  }
}

/**
 * Register the daily midnight cron task.
 * Call this once from server.ts after the database is connected.
 */
export function scheduleHardDeleteJob(): void {
  // '0 0 * * *' = At 00:00 every day
  cron.schedule('0 0 * * *', () => {
    logger.debug('[hardDeleteProfiles] Cron triggered');
    void runHardDeleteProfiles();
  });

  logger.info('[hardDeleteProfiles] Daily hard-delete job scheduled (00:00)');
}
