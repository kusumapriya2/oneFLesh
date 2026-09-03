# OneFlesh

> **A pastor-led matrimonial platform for Reformed churches in India.**  
> Building covenant marriages rooted in faith.

[![CI](https://github.com/your-org/oneflesh/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/oneflesh/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-crimson.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Local Development Setup](#local-development-setup)
7. [Environment Variables](#environment-variables)
8. [Database Operations](#database-operations)
9. [Running Tests](#running-tests)
10. [Production Deployment](#production-deployment)
11. [API Reference](#api-reference)
12. [Security Model](#security-model)
13. [Contributing](#contributing)

---

## Overview

OneFlesh is a full-stack web application that facilitates pastor-supervised matrimonial introductions within Reformed and Presbyterian church networks in India. Core features:

- **Profile management** — Church-verified candidate profiles with endorsements from elders
- **Alliance tracking** — 6-stage courtship pipeline managed by pastors
- **Pre-marital counselling** — 6-session programme with completion certificates (PDF)
- **Wedding vendors** — Curated directory of faith-friendly service providers
- **AI Pastoral Assistant** — Claude-powered co-pilot for matching, letters, and counselling prep
- **Real-time notifications** — Socket.IO for instant updates
- **MFA** — TOTP-based two-factor authentication

All profile introductions and alliance progressions require explicit pastoral approval.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Nginx (TLS termination)                │
│                ports 80/443 → internal routing           │
└──────────┬────────────────────────┬─────────────────────┘
           │ /api/* + /socket.io/   │ /*
   ┌───────▼────────┐      ┌────────▼────────┐
   │  Express API   │      │  React SPA (Vite │
   │  port 4000     │      │  built, served   │
   │                │      │  by Nginx)        │
   └───────┬────────┘      └─────────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼──┐    ┌────▼───┐
│  PG  │    │ Redis  │
│  16  │    │   7    │
└──────┘    └────────┘
```

**Monorepo layout** — npm workspaces:
- `packages/shared` — TypeScript types, Zod schemas, shared constants
- `apps/api` — Express + Prisma REST API
- `apps/web` — React + Vite SPA

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5.4 (strict) |
| API Framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Cache / Sessions | Redis 7 (ioredis) |
| Auth | JWT RS256, bcrypt, TOTP (speakeasy) |
| File Storage | AWS S3 (ap-south-1) |
| Email | Nodemailer dev / AWS SES prod |
| SMS | Twilio |
| AI | Anthropic Claude (`claude-sonnet-4-5`) |
| Real-time | Socket.IO 4 |
| Frontend | React 18 + Vite 5 |
| UI | Tailwind CSS 3 |
| State | Zustand + TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Container | Docker + Docker Compose |
| Proxy | Nginx 1.27 |
| CI/CD | GitHub Actions |

---

## Project Structure

```
oneflesh/
├── apps/
│   ├── api/                    # Express REST API
│   │   ├── src/
│   │   │   ├── config/         # env, database, redis, jwt, logger
│   │   │   ├── middleware/      # auth, rbac, rate-limit, error handler
│   │   │   ├── modules/        # feature modules (auth, profiles, alliances…)
│   │   │   │   ├── auth/
│   │   │   │   ├── churches/
│   │   │   │   ├── profiles/
│   │   │   │   ├── alliances/
│   │   │   │   ├── counselling/
│   │   │   │   ├── vendors/
│   │   │   │   ├── ai/
│   │   │   │   ├── notifications/
│   │   │   │   ├── dashboard/
│   │   │   │   └── uploads/
│   │   │   ├── prisma/         # schema.prisma + seed.ts
│   │   │   ├── socket/         # Socket.IO server
│   │   │   ├── utils/          # crypto, generateKeys
│   │   │   └── server.ts       # entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                    # React SPA
│       ├── src/
│       │   ├── components/     # UI components + layout
│       │   ├── pages/          # route-level page components
│       │   ├── services/       # Axios API client
│       │   ├── stores/         # Zustand stores
│       │   ├── hooks/          # custom hooks
│       │   └── App.tsx         # router
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── shared/                 # shared types, schemas, constants
│       └── src/
│           ├── constants/      # enums.ts
│           ├── schemas/        # Zod validation schemas
│           └── types/          # TypeScript interfaces
│
├── infrastructure/
│   ├── docker-compose.yml      # production stack
│   ├── docker-compose.dev.yml  # local backing services only
│   ├── nginx/
│   │   └── nginx.conf          # TLS + reverse proxy
│   └── scripts/
│       ├── setup.sh            # Ubuntu VPS bootstrapper
│       ├── certbot-init.sh     # Let's Encrypt first-time cert
│       └── seed-dev.sh         # dev DB seed helper
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # lint, typecheck, test, docker build
│       └── deploy.yml          # push to main → deploy to VPS
│
├── .env.example                # all required env vars
├── package.json                # workspace root
└── tsconfig.json               # base TypeScript config
```

---

## Prerequisites

- **Node.js** ≥ 20.0.0 and **npm** ≥ 10.0.0
- **Docker Desktop** (for local Postgres + Redis)
- **Git**

Optional (for full feature testing):
- AWS credentials with S3 + SES access
- Twilio account
- Anthropic API key

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/oneflesh.git
cd oneflesh
```

### 2. Install all dependencies

```bash
npm install
```

This installs dependencies for all workspaces (root, API, web, shared).

### 3. Start backing services (Postgres + Redis)

```bash
docker compose -f infrastructure/docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL 16 on port `5433`
- Redis 7 on port `6379`
- MailHog (email capture) on port `1025` (SMTP) / `8025` (web UI)
- Redis Commander (GUI) on port `8081`

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` — at minimum set these for local dev:

```env
DATABASE_URL=postgresql://oneflesh:oneflesh_dev_secret@localhost:5433/oneflesh_dev
REDIS_URL=redis://localhost:6379
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:4000

# Leave JWT keys blank — the API auto-generates them in development
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=

# 64-char hex string (any value works for dev)
ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000

# Email (dev uses MailHog — no real credentials needed)
SMTP_HOST=localhost
SMTP_PORT=1025
```

### 5. Run database migrations & seed

```bash
bash infrastructure/scripts/seed-dev.sh
```

Or manually:
```bash
npm run db:migrate   # applies pending Prisma migrations
npm run db:seed      # inserts seed data
```

### 6. Start the development servers

```bash
npm run dev
```

This concurrently starts:
- **API** at http://localhost:4000
- **Web** at http://localhost:5173

### 7. Verify

| URL | Description |
|---|---|
| http://localhost:5173 | OneFlesh frontend |
| http://localhost:4000/api/v1/health | API health check |
| http://localhost:8025 | MailHog (captured emails) |
| http://localhost:8081 | Redis Commander |

**Default login credentials** (after seed):

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@oneflesh.in | Admin@OneFlesh2025! |
| Pastor | pastor@grace-reformed.in | Pastor@OneFlesh2025! |

---

## Environment Variables

All variables are documented in `.env.example`. Required in production:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (with password) |
| `JWT_PRIVATE_KEY` | RSA-2048 private key (PEM, base64 encoded) |
| `JWT_PUBLIC_KEY` | RSA-2048 public key (PEM, base64 encoded) |
| `ENCRYPTION_KEY` | 64-char hex — AES-256 key for PII column encryption |
| `AWS_ACCESS_KEY_ID` | AWS credentials (S3 + SES, ap-south-1) |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_S3_BUCKET` | S3 bucket for profile photos |
| `AWS_SES_FROM_EMAIL` | Verified SES sender address |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio from number |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `FRONTEND_URL` | Allowed CORS origin (e.g. https://oneflesh.in) |

To generate RSA key pair for production:
```bash
npm run keys:generate -w apps/api
```
This outputs `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` values ready to paste into `.env`.

---

## Database Operations

```bash
# Run migrations (dev)
npm run db:migrate

# Deploy migrations (production — used in CI/CD)
npm run db:migrate:deploy

# Generate Prisma Client after schema changes
npm run db:generate

# Open Prisma Studio (visual DB browser)
npm run db:studio

# Reset database (dev only — destructive)
npm run db:reset

# Re-seed data
npm run db:seed
```

### Creating a new migration

```bash
cd apps/api
npx prisma migrate dev --name your_migration_name
```

---

## Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit -w apps/api

# Integration tests only (requires running Postgres + Redis)
npm run test:integration -w apps/api

# Watch mode
cd apps/api && npx jest --watch
```

Integration tests use real Postgres and Redis instances. Make sure the dev Docker services are running first.

---

## Production Deployment

### First-time server setup

```bash
# On a fresh Ubuntu 22.04 VPS (run as root):
bash infrastructure/scripts/setup.sh oneflesh.in

# Obtain TLS certificate (after DNS is pointing to the server):
bash infrastructure/scripts/certbot-init.sh oneflesh.in contact@oneflesh.in
```

### Manual deploy

```bash
# On the production server:
cd /opt/oneflesh
git pull origin main
docker compose -f infrastructure/docker-compose.yml pull
docker compose -f infrastructure/docker-compose.yml run --rm api npx prisma migrate deploy
docker compose -f infrastructure/docker-compose.yml up -d --force-recreate --remove-orphans api web
docker compose -f infrastructure/docker-compose.yml exec nginx nginx -s reload
```

### Automated CI/CD (GitHub Actions)

1. Set these repository secrets in GitHub → Settings → Secrets:
   - `DOCKER_USERNAME`, `DOCKER_TOKEN`
   - `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`, `SSH_PORT`
   - `PROD_API_URL` (e.g. `https://oneflesh.in`)
   - `SLACK_WEBHOOK_URL` (optional)
2. Push to `main` — CI runs, then deploy job SSHes into the VPS.

---

## API Reference

Base URL: `https://oneflesh.in/api/v1`

### Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Email + password login |
| POST | `/auth/mfa/verify` | Complete MFA challenge |
| POST | `/auth/logout` | Invalidate tokens |
| POST | `/auth/refresh` | Rotate access token |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Apply new password |
| POST | `/auth/mfa/setup` | Enable TOTP MFA |

### Profiles

| Method | Path | Description |
|---|---|---|
| GET | `/profiles` | List profiles (with filters) |
| POST | `/profiles` | Create profile (pastor only) |
| GET | `/profiles/:id` | Get profile detail |
| PATCH | `/profiles/:id` | Update profile |
| PATCH | `/profiles/:id/status` | Approve/pause/delete |

### Alliances

| Method | Path | Description |
|---|---|---|
| GET | `/alliances` | List alliances (scoped to church) |
| POST | `/alliances` | Create new alliance |
| GET | `/alliances/:id` | Alliance detail with notes |
| PATCH | `/alliances/:id/stage` | Advance to next stage |
| POST | `/alliances/:id/notes` | Add pastoral note |
| POST | `/alliances/:id/dissolve` | Dissolve alliance |

### Counselling

| Method | Path | Description |
|---|---|---|
| POST | `/counselling/register` | Register couple for programme |
| GET | `/counselling/:allianceId/sessions` | List 6 sessions with status |
| PATCH | `/counselling/sessions/:id/complete` | Mark session complete |
| GET | `/counselling/sessions/:id/questions` | AI-generated questions |
| GET | `/counselling/:allianceId/certificate` | Download PDF certificate |

### AI Assistant

| Method | Path | Description |
|---|---|---|
| POST | `/ai/chat` | Conversational pastoral assistant |
| POST | `/ai/match` | AI-ranked profile matching |
| POST | `/ai/draft-letter` | Generate introduction letter |
| POST | `/ai/counselling-questions` | Session discussion questions |
| POST | `/ai/alliance-summary` | Alliance status summary |

### Notifications

| Method | Path | Description |
|---|---|---|
| GET | `/notifications` | Paginated list |
| PATCH | `/notifications/:id/read` | Mark as read |
| PATCH | `/notifications/read-all` | Mark all read |
| DELETE | `/notifications/:id` | Delete notification |

---

## Security Model

### Authentication & Authorisation
- **JWT RS256** — access tokens (15 min TTL), refresh tokens (7 days, stored in Redis)
- **HttpOnly cookies** for refresh token transport
- **TOTP MFA** — optional per user, required for admins
- **Account lockout** — 5 failed logins → 30-minute lock
- **RBAC** — `SUPER_ADMIN > CHURCH_ADMIN > PASTOR > VENDOR > READ_ONLY`
- **ABAC** — pastors can only manage profiles/alliances within their verified church

### Data Protection
- **AES-256-GCM** encryption for PII columns (phone, email)
- **bcrypt** cost factor 12 for password hashing
- **Data residency** — all storage on AWS `ap-south-1` (Mumbai)

### Transport & Infrastructure
- **HSTS** with preload, 1-year max-age
- **CSP** headers blocking inline scripts
- **Rate limiting** — 100 req/15min per IP; 5 req/15min for auth endpoints
- **AI rate limiting** — 50 requests/user/day; $20 spend alert, $50 circuit breaker
- **AI PII guard** — system prompt instructs Claude never to output phone numbers, emails, or addresses

### Audit
- Every auth event (`LOGIN`, `LOGOUT`, `PASSWORD_RESET`, `MFA_ENABLED` etc.) written to `AuditLog`
- All AI interactions stored in `AIInteraction` table with token + cost tracking

---

## Contributing

1. Fork and create a feature branch: `git checkout -b feat/your-feature`
2. Make changes following the existing code style (ESLint + Prettier enforce this)
3. Write/update tests
4. Run `npm run typecheck && npm run lint && npm test`
5. Open a pull request against `develop`

Please do not commit `.env` files, private keys, or credentials.

---

*OneFlesh — Built for Reformed churches across India · All alliances pastoral-approved*
