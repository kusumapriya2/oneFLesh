// ============================================================
// OneFlesh — Winston Logger
// ============================================================

import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = process.env['LOG_DIR'] ?? './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp as string}] ${level}: ${message as string}${metaStr}`;
  }),
);

export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] ?? 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') }),
  ],
});

if (process.env['NODE_ENV'] !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}
