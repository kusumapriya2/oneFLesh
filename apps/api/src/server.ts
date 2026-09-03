// ============================================================
// OneFlesh API — Express Server Entry Point
// ============================================================

import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { redis } from './config/redis.js';
import { getJwtKeys } from './config/jwt.js';
import { initSocket } from './socket/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import express, { type Express } from 'express';

// ─── Route imports ─────────────────────────────────────────────
import { authRouter } from './modules/auth/auth.routes.js';
import { churchRouter } from './modules/churches/churches.routes.js';
import { profileRouter } from './modules/profiles/profiles.routes.js';
import { allianceRouter } from './modules/alliances/alliances.routes.js';
import { counsellingRouter } from './modules/counselling/counselling.routes.js';
import { vendorRouter } from './modules/vendors/vendors.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { notificationRouter } from './modules/notifications/notifications.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { uploadRouter } from './modules/uploads/uploads.routes.js';
import { scheduleHardDeleteJob } from './jobs/hardDeleteProfiles.js';

// ─── App setup ─────────────────────────────────────────────────
const app: Express = express();
const httpServer = createServer(app);

// ─── Security headers ──────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://*.amazonaws.com'],
        scriptSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// ─── CORS ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: [env.FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Response-Time'],
  }),
);

// ─── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Request logging ───────────────────────────────────────────
app.use(requestLogger);
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.path === '/api/v1/health',
  }),
);

// ─── Health check ──────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      version: '1.0.0',
      platform: 'OneFlesh',
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── API routes ────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRouter);
app.use(`${API}/churches`, churchRouter);
app.use(`${API}/profiles`, profileRouter);
app.use(`${API}/alliances`, allianceRouter);
app.use(`${API}/counselling`, counsellingRouter);
app.use(`${API}/vendors`, vendorRouter);
app.use(`${API}/ai`, aiRouter);
app.use(`${API}/notifications`, notificationRouter);
app.use(`${API}/dashboard`, dashboardRouter);
app.use(`${API}/uploads`, uploadRouter);

// ─── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// ─── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ─── Socket.io ─────────────────────────────────────────────────
initSocket(httpServer);

// ─── Startup ───────────────────────────────────────────────────
async function start() {
  // Initialise JWT keys early
  getJwtKeys();

  // Connect to database
  await connectDatabase();

  // H-04: Schedule daily hard-delete cron (consumes hardDeleteAt set by deleteProfile)
  scheduleHardDeleteJob();

  // Start server
  httpServer.listen(env.PORT, () => {
    logger.info(`✅ OneFlesh API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`   Frontend: ${env.FRONTEND_URL}`);
    logger.info(`   API Base: ${env.API_URL}/api/v1`);
  });
}

// ─── Graceful shutdown ─────────────────────────────────────────
async function shutdown(signal: string) {
  logger.info(`${signal} received — graceful shutdown starting`);
  httpServer.close(async () => {
    await disconnectDatabase();
    await redis.quit();
    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export { app, httpServer };
