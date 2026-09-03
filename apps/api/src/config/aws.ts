// ============================================================
// OneFlesh — AWS SDK Configuration
// ============================================================

import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import { env } from './env.js';

export const s3Client = new S3Client({
  region: env.AWS_REGION,
  ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export const sesClient = new SESClient({
  region: env.AWS_REGION,
  ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export const S3_BUCKET = env.AWS_S3_BUCKET;
export const SES_FROM = env.AWS_SES_FROM_EMAIL;
