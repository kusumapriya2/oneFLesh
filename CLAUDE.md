# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OneFlesh** is a pastor-led matrimonial platform for Reformed churches in India. Features: church-supervised profile introductions, 6-stage alliance tracking, pre-marital counselling, wedding vendor directories, and an AI pastoral assistant (Anthropic Claude).

## Monorepo Structure

npm workspaces — no turborepo/nx. Run workspace-scoped commands from root with `-w <workspace>`.

```
apps/api/          Express REST API (port 4000)
apps/web/          React SPA via Vite (port 5173)
packages/shared/   Shared TypeScript types, Zod schemas, constants (@oneflesh/shared)
infrastructure/    Docker Compose, Nginx, deploy scripts
```

## Commands

### Root (all workspaces)

```bash
npm run dev          # shared + API + web in watch mode (concurrent)
npm run build        # ordered: shared → API → web
npm run lint         # ESLint across all workspaces
npm run typecheck    # tsc --noEmit across all workspaces
npm test             # jest --runInBand in apps/api
npm run format       # Prettier on **/*.{ts,tsx,js,json,md}
```

### Database (from root, delegates to apps/api)

```bash
npm run db:migrate           # prisma migrate dev
npm run db:migrate:deploy    # prisma migrate deploy (CI/prod)
npm run db:generate          # prisma generate (after schema changes)
npm run db:seed              # tsx src/prisma/seed.ts
npm run db:studio            # Prisma Studio GUI
npm run db:reset             # prisma migrate reset --force (dev only)
```

### Single-workspace commands

```bash
npm run dev -w apps/api              # tsx watch src/server.ts
npm run test:unit -w apps/api        # unit tests only (no DB/Redis needed)
npm run test:integration -w apps/api # requires live PG + Redis
npm run dev -w apps/web              # vite
npm run keys:generate -w apps/api    # generate RSA keypair for JWT
```

### Local backing services

```bash
docker compose -f infrastructure/docker-compose.dev.yml up -d
# PostgreSQL 16 (5433), Redis 7 (6379), MailHog (1025/8025), Redis Commander (8081)
```

### Quick start

```bash
npm install
docker compose -f infrastructure/docker-compose.dev.yml up -d
cp .env.example .env   # then fill in values
npm run db:migrate && npm run db:seed
npm run dev
# API: http://localhost:4000/api/v1/health  |  Web: http://localhost:5173
```

## API Architecture (`apps/api`)

**Entry point**: `src/server.ts` — Express app, HTTP server, Socket.IO, graceful shutdown.

All routes are prefixed `/api/v1/`. Each module follows the pattern `.routes / .controller / .service`.

| Module | Prefix |
|---|---|
| auth | `/api/v1/auth` |
| profiles | `/api/v1/profiles` |
| alliances | `/api/v1/alliances` |
| counselling | `/api/v1/counselling` |
| churches | `/api/v1/churches` |
| vendors | `/api/v1/vendors` |
| ai | `/api/v1/ai` |
| notifications | `/api/v1/notifications` |
| dashboard | `/api/v1/dashboard` |
| uploads | `/api/v1/uploads` |

**Response envelope**:
```typescript
{ success: true, data: <payload> }          // success
{ success: false, error: { code, message } } // error
```

**Middleware** (`src/middleware/`): `authenticate.ts` (JWT RS256 Bearer), `authorize.ts` (RBAC), `churchGuard.ts` (ABAC — pastors scoped to their church), `rateLimiter.ts`, `validate.ts` (Zod), `auditLogger.ts`, `errorHandler.ts`.

**Security model**:
- RBAC roles: `SUPER_ADMIN > CHURCH_ADMIN > PASTOR > VENDOR > READ_ONLY`
- PII columns (phone/email) are AES-256-GCM encrypted; key from `ENCRYPTION_KEY` env var
- JWT: RS256, access tokens 15 min, refresh tokens 7 days stored in Redis; max 3 sessions/user
- Auth rate limit: 5 req/15 min; account lockout after 5 failed logins (30 min)
- AI: 50 requests/user/day; $20 alert / $50 circuit breaker

**Background jobs**: `src/jobs/hardDeleteProfiles.ts` — daily cron (node-cron) to hard-delete profiles soft-deleted ≥ 30 days ago.

## Web App Architecture (`apps/web`)

**Entry point**: `src/main.tsx` → `src/App.tsx` (React Router v6).

**API client**: `src/services/api.ts` — single Axios instance. Base URL from `VITE_API_URL`. Request interceptor attaches Bearer token; response interceptor does silent 401 refresh (queues concurrent requests). All typed API modules are exported from this file: `authApi`, `profilesApi`, `alliancesApi`, etc.

**State** (Zustand stores in `src/stores/`):
- `authStore.ts` — user identity, access token, `setAccessToken()`, `clearAuth()`
- `notificationStore.ts` — real-time notifications (Socket.IO)
- `uiStore.ts` — UI state

## Shared Package (`packages/shared`)

```
src/constants/   role/status enums
src/schemas/     Zod validation schemas
src/types/       TypeScript interfaces
```

Used as `@oneflesh/shared` by both API and web. Always update shared schemas before changing API contracts.

## Tech Stack

| Concern | Technology |
|---|---|
| API framework | Express 4 |
| ORM / DB | Prisma 5 + PostgreSQL 16 |
| Cache / sessions | Redis 7 (ioredis) |
| Auth | JWT RS256, bcrypt cost 12, TOTP (speakeasy) |
| File storage | AWS S3 ap-south-1 |
| Email | Nodemailer dev / AWS SES prod |
| SMS/WhatsApp | Twilio |
| AI | Anthropic Claude (`claude-sonnet-4-5` via `@anthropic-ai/sdk`) |
| Real-time | Socket.IO 4 |
| Frontend | React 18 + Vite 5 |
| UI | Tailwind CSS 3 + lucide-react |
| Forms | React Hook Form + Zod + @hookform/resolvers |
| Data fetching | TanStack Query v5 |
| Testing | Jest 29 + ts-jest + Supertest |

## TypeScript Config

Root `tsconfig.json` sets strict mode for all workspaces: `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`. Each workspace extends root config.

## Environment Variables

API env validated at startup via `envalid` (`src/config/env.ts`). Minimum for local dev:

```env
DATABASE_URL=postgresql://oneflesh:oneflesh_dev_secret@localhost:5433/oneflesh_dev
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173
ENCRYPTION_KEY=<64 hex chars>
SMTP_HOST=localhost
SMTP_PORT=1025
```

Web: `apps/web/.env` with `VITE_API_URL=http://localhost:4000`.

Production also requires: `AWS_*`, `TWILIO_*`, `ANTHROPIC_API_KEY`. Generate RSA keys with `npm run keys:generate -w apps/api`.

## Default Dev Credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@oneflesh.in | Admin@OneFlesh2025! |
| Pastor | pastor@grace-reformed.in | Pastor@OneFlesh2025! |
