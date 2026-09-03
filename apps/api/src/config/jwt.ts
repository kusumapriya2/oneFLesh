// ============================================================
// OneFlesh — JWT RS256 Configuration
// ============================================================

import crypto from 'crypto';
import { env } from './env.js';
import { logger } from './logger.js';

interface KeyPair {
  privateKey: string;
  publicKey: string;
}

let keyPair: KeyPair | null = null;

export function getJwtKeys(): KeyPair {
  if (keyPair) return keyPair;

  if (env.JWT_PRIVATE_KEY && env.JWT_PUBLIC_KEY) {
    keyPair = {
      privateKey: env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      publicKey: env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'),
    };
    logger.info('✅ JWT keys loaded from environment');
    return keyPair;
  }

  // Generate ephemeral key pair for development
  logger.warn('⚠️  JWT keys not found in env — generating ephemeral RS256 key pair (dev only)');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  keyPair = { privateKey, publicKey };

  if (env.NODE_ENV === 'production') {
    logger.error('❌ FATAL: JWT keys must be set in production!');
    process.exit(1);
  }

  return keyPair;
}
