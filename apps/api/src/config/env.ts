// ============================================================
// OneFlesh — Environment Validation
// ============================================================

import { cleanEnv, str, num } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: num({ default: 3001 }),
  FRONTEND_URL: str({ default: 'http://localhost:5173' }),
  API_URL: str({ default: 'http://localhost:3001' }),

  DATABASE_URL: str(),
  REDIS_URL: str({ default: 'redis://localhost:6379' }),

  JWT_PRIVATE_KEY: str({ default: '' }),
  JWT_PUBLIC_KEY: str({ default: '' }),
  JWT_ACCESS_TTL: num({ default: 900 }),
  JWT_REFRESH_TTL: num({ default: 604800 }),

  AWS_REGION: str({ default: 'ap-south-1' }),
  AWS_ACCESS_KEY_ID: str({ default: '' }),
  AWS_SECRET_ACCESS_KEY: str({ default: '' }),
  AWS_S3_BUCKET: str({ default: 'oneflesh-uploads' }),
  AWS_SES_FROM_EMAIL: str({ default: 'noreply@oneflesh.in' }),

  TWILIO_ACCOUNT_SID: str({ default: '' }),
  TWILIO_AUTH_TOKEN: str({ default: '' }),
  TWILIO_PHONE_NUMBER: str({ default: '' }),
  // WhatsApp Business number in full format: whatsapp:+14155238886 (sandbox)
  // or whatsapp:+91<number> for a production WhatsApp Business number.
  TWILIO_WHATSAPP_FROM: str({ default: '' }),

  ANTHROPIC_API_KEY: str({ default: '' }),
  AI_DAILY_SPEND_ALERT: num({ default: 20 }),
  AI_DAILY_SPEND_LIMIT: num({ default: 50 }),

  BCRYPT_ROUNDS: num({ default: 12 }),
  MAX_LOGIN_ATTEMPTS: num({ default: 5 }),
  ACCOUNT_LOCKOUT_MINUTES: num({ default: 30 }),
  PROFILE_HARD_DELETE_DAYS: num({ default: 30 }),
  MAX_CONCURRENT_SESSIONS: num({ default: 3 }),

  LOG_LEVEL: str({ default: 'info' }),
  LOG_DIR: str({ default: './logs' }),
});
