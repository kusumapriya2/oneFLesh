# OneFlesh — Application Architecture
### Reformed Church Matrimonial Platform · Technical Design Document · May 2026

> **Purpose:** This document describes the complete system architecture of OneFlesh — the monorepo structure, technology choices, data model, API design, frontend architecture, infrastructure, and the key patterns that run through the entire codebase. It is intended as a reference for developers, architects, and as an interview study guide.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Technology Stack](#3-technology-stack)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Design](#5-database-design)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Shared Package — The Contract Layer](#7-shared-package--the-contract-layer)
8. [Authentication & Authorisation Flow](#8-authentication--authorisation-flow)
9. [Real-Time Architecture (Socket.IO)](#9-real-time-architecture-socketio)
10. [AI Integration Architecture](#10-ai-integration-architecture)
11. [File Storage & Media Architecture](#11-file-storage--media-architecture)
12. [Infrastructure & Deployment](#12-infrastructure--deployment)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [Security Architecture](#14-security-architecture)
15. [Core Business Flows](#15-core-business-flows)
16. [Environment Configuration](#16-environment-configuration)
17. [Architectural Decisions & Trade-offs](#17-architectural-decisions--trade-offs)

---

## 1. System Overview

OneFlesh is a **multi-tenant, pastor-led church matrimonial platform** designed for the Reformed Christian community in India. It is not a self-service dating app — all profile creation, alliance initiation, and stage progression are mediated by pastors. Every action leaves an audit trail.

### High-Level System Context

```
                          ┌─────────────────────────────────────────┐
                          │                INTERNET                  │
                          └────────────────────┬────────────────────┘
                                               │ HTTPS / WSS
                                     ┌─────────▼─────────┐
                                     │    Nginx Reverse   │
                                     │    Proxy + TLS     │
                                     │  (Certbot LE cert) │
                                     └─────┬─────────┬────┘
                                           │         │
                         ┌─────────────────▼──┐  ┌───▼──────────────────┐
                         │   Web Frontend     │  │    REST API + WS      │
                         │   React 18 + Vite  │  │    Express + Socket   │
                         │   Port 80 (Nginx)  │  │    Port 4000          │
                         └────────────────────┘  └────┬────────┬─────────┘
                                                       │        │
                                           ┌───────────▼──┐  ┌──▼────────────┐
                                           │  PostgreSQL  │  │    Redis       │
                                           │  (Primary DB)│  │ (Cache, Queue, │
                                           │  Port 5432   │  │  Rate Limits,  │
                                           │              │  │  Sessions)     │
                                           └──────────────┘  └───────────────┘
                                                                      │
                                           ┌───────────────────────┐  │
                                           │   External Services    │  │
                                           │  • Anthropic Claude AI │  │
                                           │  • AWS S3 (Photos)     │  │
                                           │  • AWS SES (Email)     │  │
                                           │  • Twilio (SMS/OTP)    │  │
                                           └───────────────────────┘
```

### Core Entities at a Glance

| Entity | Description |
|--------|-------------|
| **Church** | The unit of trust. Must be approved by super admin before members can use the platform. |
| **User (Pastor)** | Manages profiles within their church. All actions are scoped to their church. |
| **Profile** | A matrimonial candidate entry. Created by a pastor, approved before visible to others. |
| **Alliance** | A directed match between two profiles across (potentially) two churches. Follows a 5-stage lifecycle. |
| **Counselling Session** | 6 structured pre-marital sessions that must be completed before engagement (Stage 5). |
| **Vendor** | A wedding service provider in the directory. |
| **Notification** | Real-time events pushed to pastors via WebSocket. |

---

## 2. Monorepo Structure

OneFlesh uses **npm workspaces** as its monorepo strategy — no Nx, no Turborepo, intentionally keeping the toolchain minimal.

```
OneFlesh/                           ← Monorepo root
├── package.json                    ← Workspace root (npm workspaces: ["apps/*", "packages/*"])
├── tsconfig.json                   ← Root TypeScript base config
├── .eslintrc.js                    ← Shared ESLint config
├── .prettierrc                     ← Shared Prettier config
│
├── packages/
│   └── shared/                     ← @oneflesh/shared (shared contract layer)
│       ├── src/
│       │   ├── types/index.ts      ← TypeScript interfaces (mirrors Prisma models)
│       │   ├── schemas/index.ts    ← Zod validation schemas
│       │   ├── constants/enums.ts  ← All enums, constants, lookups
│       │   └── index.ts            ← Barrel export
│       └── package.json
│
├── apps/
│   ├── api/                        ← Backend Express API
│   │   ├── src/
│   │   │   ├── server.ts           ← Express entry point
│   │   │   ├── config/             ← env, database, redis, jwt, aws, logger
│   │   │   ├── middleware/         ← auth, rbac, rate-limit, validate, error, audit
│   │   │   ├── modules/            ← 8 business domain modules
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
│   │   │   ├── prisma/             ← schema.prisma + seed.ts
│   │   │   ├── socket/             ← Socket.IO server
│   │   │   └── utils/              ← response, crypto, email, sms, generateKeys
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                        ← Frontend React SPA
│       ├── src/
│       │   ├── main.tsx            ← Vite + React entry point
│       │   ├── App.tsx             ← Router with protected routes + ErrorBoundary
│       │   ├── pages/              ← 16 page components (lazy-loaded)
│       │   ├── components/         ← UI kit + domain components
│       │   ├── stores/             ← Zustand (auth, notifications, ui)
│       │   ├── services/           ← Axios API client
│       │   ├── hooks/              ← useSocket, custom hooks
│       │   └── styles/             ← Tailwind + global CSS
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       └── package.json
│
└── infrastructure/
    ├── docker-compose.yml          ← Production stack
    ├── docker-compose.dev.yml      ← Development backing services
    ├── nginx/
    │   └── nginx.conf              ← Reverse proxy, TLS, rate limiting
    ├── scripts/
    │   ├── setup.sh                ← VPS provisioning script
    │   └── seed-dev.sh             ← Dev database seed helper
    └── .github/
        └── workflows/
            ├── ci.yml              ← Lint + Test + Build + Audit
            └── deploy.yml          ← Docker build + SSH deploy
```

### Why This Structure?

**Workspace boundary principle:** Each workspace has a single responsibility.

| Workspace | Responsibility | Cannot import from |
|-----------|---------------|-------------------|
| `packages/shared` | Types, schemas, constants | `apps/api`, `apps/web` |
| `apps/api` | Business logic, data access | `apps/web` |
| `apps/web` | UI, user interaction | `apps/api` directly |

`packages/shared` is the **contract layer** — both the API and Web depend on it but it depends on neither. This enforces that the contract (what a valid request looks like, what a response contains) is the single source of truth.

---

## 3. Technology Stack

### Backend

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 20 LTS | Async I/O, large ecosystem, matches frontend language |
| Framework | Express 4 | Minimal, explicit, no hidden magic |
| Language | TypeScript 5 (strict mode) | Type safety across the stack |
| ORM | Prisma 5 | Type-safe queries, migration tooling, protects against SQL injection |
| Database | PostgreSQL 16 | ACID compliance, JSON fields, full-text search |
| Cache / Queue | Redis 7 | Rate limiting counters, session data, real-time event backing |
| Auth | JWT RS256 + TOTP MFA | Asymmetric signing, industry-standard 2FA |
| Validation | Zod 3 | Runtime type safety, TypeScript-first |
| Real-time | Socket.IO 4 | Room-based WebSocket, automatic fallback |
| File Storage | AWS S3 | Scalable object storage, pre-signed URLs |
| Email | AWS SES | Transactional email, high deliverability |
| SMS / OTP | Twilio | OTP for MFA |
| AI | Anthropic Claude API | Pastoral assistant, match scoring |
| Logging | Pino | Structured JSON logging, extremely fast |
| Security | Helmet | HTTP security headers |
| Env validation | envalid | Validates all env vars at startup |

### Frontend

| Layer | Technology | Why |
|-------|-----------|-----|
| Build tool | Vite 5 | Instant HMR, ESM-native |
| Framework | React 18 | Component model, rich ecosystem |
| Language | TypeScript 5 | Same as backend, shared types |
| Routing | React Router v6 | Declarative, lazy loading |
| State | Zustand | Minimal, no boilerplate, devtools |
| Data fetching | TanStack Query v5 | Server state management, caching |
| HTTP client | Axios | Interceptors for auth token injection |
| Forms | React Hook Form + Zod | Performant, validates against shared schemas |
| Styling | Tailwind CSS v3 + custom | Utility-first, Crimson Velvet design system |
| Icons | Lucide React | Consistent icon library |
| Toasts | React Hot Toast | Non-blocking notifications |

### Infrastructure

| Layer | Technology | Why |
|-------|-----------|-----|
| Containerisation | Docker + Compose | Reproducible environments |
| Reverse Proxy | Nginx 1.27 | TLS termination, rate limiting, SPA routing |
| TLS | Certbot / Let's Encrypt | Free, auto-renewing certificates |
| CI/CD | GitHub Actions | First-class Docker support, free for public repos |
| VPS deployment | SSH + Docker Compose | Simple, no Kubernetes overhead at this scale |

---

## 4. Backend Architecture

### Module Architecture

Each business domain follows the same three-file pattern: **routes → (middleware) → handler/controller → service**.

```
apps/api/src/modules/{domain}/
├── {domain}.routes.ts       ← Express Router, middleware wiring
├── {domain}.controller.ts   ← Request/response handling (auth module only)
└── {domain}.service.ts      ← Business logic, Prisma queries
```

The **Routes** file is the wiring layer — it declares the HTTP verb, path, middleware chain, and handler:

```typescript
// Example: profiles.routes.ts
router.get('/',
  authenticate,                        // 1. Verify JWT
  authorize([UserRole.PASTOR, ...]),   // 2. Check role
  churchGuard,                         // 3. Scope to church
  validateQuery(ProfileSearchSchema),  // 4. Validate query params
  listProfiles                         // 5. Execute handler
);
```

The **Service** file contains all business logic and database operations. It never touches `req` or `res` — it receives plain TypeScript arguments and returns plain data.

### Middleware Stack (Request Pipeline)

Every request passes through this chain, in order:

```
Incoming HTTP Request
        │
        ▼
┌───────────────────┐
│  Helmet (headers) │  Content-Security-Policy, HSTS, X-Frame-Options
└────────┬──────────┘
         ▼
┌───────────────────┐
│  CORS             │  Whitelist: env.FRONTEND_URL only
└────────┬──────────┘
         ▼
┌───────────────────┐
│  Body Parser      │  JSON, 10KB limit
└────────┬──────────┘
         ▼
┌───────────────────┐
│  Request Logger   │  UUID request ID, duration, userId, IP (no body)
└────────┬──────────┘
         ▼
┌───────────────────┐
│  Rate Limiter     │  Redis-backed, tier-based
└────────┬──────────┘
         ▼
┌───────────────────┐
│  Route Handler    │  authenticate → authorize → churchGuard → validate → service
└────────┬──────────┘
         ▼
┌───────────────────┐
│  Error Handler    │  Formats AppError/ZodError → JSON response
└────────┬──────────┘
         ▼
HTTP Response
```

### The `AppError` Pattern

All business logic errors are thrown as structured `AppError` objects. The global error handler catches them and formats a consistent JSON response.

```typescript
// Thrown in service
throw new AppError(404, 'PROFILE_NOT_FOUND', `Profile ${id} not found`);

// Caught by errorHandler middleware
// → HTTP 404: { success: false, error: { code: "PROFILE_NOT_FOUND", message: "..." } }
```

### Module Inventory

| Module | Key Responsibilities |
|--------|---------------------|
| **auth** | Login, MFA setup/verify, JWT issue/refresh, password reset, account lockout |
| **churches** | Registration, approval workflow, status management (PENDING → APPROVED → SUSPENDED) |
| **profiles** | CRUD, multi-field search, approval, pause, soft-delete (30-day retention), shortlist, S3 photo upload |
| **alliances** | Create (both profiles must be APPROVED), 5-stage progression, notes, dissolution |
| **counselling** | Register couple, 6-session tracking, completion gating for Stage 5 |
| **vendors** | Directory listing, verification, featured flag, category/state filtering |
| **ai** | Match scoring, intro letter drafting, counselling Q generation, alliance summaries, freeform pastoral chat |
| **notifications** | Create + list + mark-read; real-time push via Socket.IO `emitToUser` |
| **dashboard** | Pastor stats (4 metrics) + Admin stats (8 metrics) in single aggregated query |
| **uploads** | S3 pre-signed URL generation for direct browser upload |

---

## 5. Database Design

### Entity Relationship Overview

```
                    ┌──────────────────────────────────────────────┐
                    │                  CHURCH                       │
                    │  id, name, denomination, city, state          │
                    │  pastorName/Email/Phone                       │
                    │  doctrinalFlags (JSON), status                │
                    └────┬──────────────────────┬───────────────────┘
                         │ 1:N                  │ 1:N
              ┌──────────▼──────────┐  ┌────────▼─────────────────┐
              │       USER          │  │        PROFILE             │
              │  id, email, role    │  │  id, fullName*, age, city  │
              │  passwordHash       │  │  seeking (BRIDE|GROOM)     │
              │  mfaEnabled         │  │  testimony*, endorsements* │
              │  failedAttempts     │  │  pastorRecommendation*     │
              │  lockedUntil        │  │  fatherName*, photoUrl     │
              └──────────┬──────────┘  │  status, deletedAt         │
                         │             └──────┬───────────┬─────────┘
                         │ 1:N               │ 1:N       │ 1:N
                         │             ┌─────▼──┐ ┌──────▼──────────────┐
                         │             │SHORTLIST│ │      ALLIANCE        │
                         │             │PROFILE  │ │ profile1Id, profile2Id│
                         │             │(junction│ │ church1Id, church2Id │
                         │             │  table) │ │ stage (1-5), status  │
                         │             └─────────┘ │ openedAt, dissolvedAt│
                         │                         └─────┬──────────┬────┘
                         │                               │ 1:N      │ 1:N
                         │                    ┌──────────▼──┐  ┌────▼────────────────┐
                         │                    │ ALLIANCE    │  │ COUNSELLING SESSION  │
                         │                    │    NOTE     │  │ session# (1-6)       │
                         │                    │ content     │  │ format, status       │
                         │                    │ authorId(FK)│  │ groomName, brideName │
                         │                    └─────────────┘  │ counsellorName       │
                         │                                      └─────────────────────┘
                         │ 1:N
              ┌───────────▼────────┐    ┌─────────────────────┐
              │    NOTIFICATION    │    │       VENDOR         │
              │  type, title, body │    │  businessName        │
              │  read, relatedId   │    │  category, location  │
              └────────────────────┘    │  verified, featured  │
                                        └─────────────────────┘

              * = Encrypted at rest
```

### The 14 Prisma Models

| Model | Records represent | Key design decision |
|-------|-------------------|---------------------|
| `User` | Platform accounts (pastors, admins, vendors) | MFA secret encrypted; account lockout fields on-model |
| `Church` | Church organisations | `doctrinalFlags` as JSON to avoid rigid schema |
| `Profile` | Matrimonial candidates | Soft-delete with `hardDeleteAt` scheduler; 5 encrypted fields |
| `Alliance` | Matches in progress | `church1Id`/`church2Id` denormalised for efficient scoping |
| `AllianceNote` | Pastoral notes on alliances | Cascade delete on alliance delete |
| `CounsellingSession` | Pre-marital session records | `sessionNumber` 1–6 enforced by service layer |
| `Vendor` | Wedding service businesses | `churchId` nullable (vendors not required to be church members) |
| `Notification` | Event notifications | `relatedEntityType + relatedEntityId` for polymorphic links |
| `ShortlistedProfile` | Pastor's saved profiles | Unique composite key `(pastorId, profileId)` |
| `AuditLog` | Immutable action history | `userId` SetNull on delete (logs survive user deletion) |
| `AIInteraction` | Claude API call history | `tokensUsed` for billing analytics |
| `FeatureFlag` | Runtime feature toggles | (Reserved for future use) |
| `UserSession` | Refresh token tracking | `MAX_CONCURRENT_SESSIONS = 3` enforced by service |
| `ChurchDocument` | Uploaded church documents | S3 key stored |

### Key Database Patterns

**1. Soft Delete with Scheduled Hard Delete:**

```
Profile deleted by pastor
    │
    ▼ status = DELETED, deletedAt = now(), hardDeleteAt = now() + 30 days
    │
    └──► Background job (or cron) checks hardDeleteAt < now()
         → Permanent DELETE + S3 photo cleanup
```

**2. Encryption at Rest via Prisma Middleware:**

```typescript
// Prisma $use middleware intercepts writes/reads
// BEFORE write: encrypt sensitive fields
// AFTER read: decrypt sensitive fields
// Application code works with plaintext — middleware handles transparently
```

Fields encrypted: `fullName`, `testimony`, `pastorRecommendation`, `endorsements` (JSON), `fatherName`, `mfaSecret`, `mfaBackupCodes`.

**3. Church-Level Data Isolation:**

```typescript
// churchGuard middleware: every query is scoped to the requesting user's church
// Non-admin users cannot see another church's profiles, alliances, or sessions
if (userRole !== SUPER_ADMIN && userRole !== CHURCH_ADMIN) {
  filters.churchId = req.user.churchId; // ← injected by middleware
}
```

**4. Alliance Denormalisation:**

The `Alliance` model stores both `church1Id` and `church2Id` directly (rather than joining through `profile → church`). This is deliberate — it makes the common query "find all alliances involving my church" a simple WHERE clause instead of a multi-join.

### Indexes

Every foreign key and every query filter field has an index:

```sql
-- Profile indexes
@@index([churchId])    -- "show me my church's profiles"
@@index([seeking])     -- "filter by BRIDE or GROOM"
@@index([state])       -- "filter by state"
@@index([status])      -- "approved profiles only"
@@index([age])         -- "filter by age range"

-- Alliance indexes
@@index([profile1Id]), @@index([profile2Id])  -- "alliances for a profile"
@@index([status]), @@index([stage])            -- "active alliances at stage 3"

-- Notification indexes
@@index([userId, read])  -- "unread notifications for user X"
```

---

## 6. Frontend Architecture

### Component Hierarchy

```
main.tsx  (QueryClient, React.StrictMode, Toaster)
└── App.tsx  (Router, silent token refresh, socket init)
    ├── ErrorBoundary  (crash isolation per route)
    ├── Suspense       (lazy load with PageLoader fallback)
    └── Routes
        ├── Public Routes
        │   ├── HomePage
        │   │   ├── Header (nav, auth state)
        │   │   ├── [Hero, HowItWorks, Gallery, Vendors sections]
        │   │   ├── AIPanel (pastoral AI assistant)
        │   │   └── Footer
        │   ├── LoginPage (RHF + Zod)
        │   ├── RegisterChurchPage (multi-step RHF + Zod)
        │   └── VendorsPage
        │
        └── Protected Routes  (ProtectedRoute wrapper → /login)
            ├── ProfilesPage  (search, filters, grid, ProfileModal)
            ├── AddProfilePage (3-step RHF wizard)
            ├── ProfileDetailPage (full detail, Express Interest, Shortlist)
            ├── AlliancesPage (tabbed: Active/Completed/Dissolved, pipeline)
            ├── AllianceDetailPage (stage timeline, notes, counselling sessions)
            ├── CounsellingPage (6-module cards, register form, active sessions)
            ├── DashboardPage (stats, recent alliances, shortlist)
            └── AdminDashboardPage (church approvals, platform stats)
```

### State Management Strategy

Three stores handle three distinct concerns:

| Store | State | Persistence |
|-------|-------|-------------|
| `authStore` | `user`, `accessToken`, `isAuthenticated`, `isLoading` | `user` persisted to localStorage (never token) |
| `notificationStore` | `notifications[]`, `unreadCount` | Memory only (re-fetched on mount) |
| `uiStore` | Modal open states, sidebar open | Memory only |

**Why only `user` is persisted (not the token):**

The access token has a 15-minute TTL. On page reload, the stored `user` object tells us "someone was logged in here" — we attempt a silent token refresh via `/auth/refresh` (using the httpOnly refresh token cookie). If it succeeds, we restore the session seamlessly. If it fails, we redirect to `/login`. This avoids the security risk of a long-lived token in `localStorage`.

```
Page Reload
    │
    ▼
authStore has user but no token?
    │
    ├── YES → POST /api/v1/auth/refresh (with httpOnly cookie)
    │              │
    │              ├── Success → setAuth(user, newToken) → user stays logged in
    │              └── Failure → clearAuth() → redirect to /login
    │
    └── NO → no user in store → show /login
```

### Data Fetching Pattern (TanStack Query)

All server state is managed by TanStack Query. Consistent patterns:

```typescript
// READ: useQuery with structured query key
const { data, isLoading, isError } = useQuery({
  queryKey: ['profiles', appliedFilters],  // ← filters in key = re-fetch on change
  queryFn: () => profilesApi.list(filters),
  staleTime: 5 * 60 * 1000,  // 5 minutes (global default)
  retry: (n, err) => n < 2 && err.status !== 401,
});

// WRITE: useMutation with cache invalidation
const mutation = useMutation({
  mutationFn: (data) => alliancesApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['alliances'] });
    toast.success('Alliance created');
  },
  onError: () => toast.error('Something went wrong'),
});
```

### Route Protection Architecture

```typescript
function ProtectedRoute({ children, refreshing }) {
  const { isAuthenticated } = useAuthStore();

  if (refreshing) return <PageLoader />;        // Waiting for silent refresh
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

Combined with `ErrorBoundary` per route — so a crash on the Profiles page shows a friendly recovery UI without affecting navigation or other pages.

### Design System — Crimson Velvet

All colours are defined as Tailwind custom tokens in `tailwind.config.ts`:

```typescript
// Crimson Velvet palette
'crimson-deep':  '#2C0F12'  // Primary dark — buttons, headers
'crimson-mid':   '#6B1E23'  // Secondary — labels, borders
'crimson-body':  '#4a1a1e'  // Body text on dark backgrounds
'gold':          '#c9a84c'  // Active nav states
'gold-light':    '#fed7b8'  // Accent text on dark
'cream':         '#fdf9f7'  // Page background
'warm-white':    '#ffffff'  // Pure white
```

**Button pattern (Crimson Velvet pill):** All non-danger buttons share the same style — `rounded-full`, dark crimson background, white `font-light` `tracking-widest` `uppercase` text, inset glow shadow.

---

## 7. Shared Package — The Contract Layer

`packages/shared` (`@oneflesh/shared`) is the most architecturally important package. It defines the contract between the frontend and backend.

### What Lives Here

```
packages/shared/src/
├── types/index.ts       ← TypeScript interfaces (mirrors every Prisma model)
├── schemas/index.ts     ← Zod validation schemas (every request payload)
├── constants/enums.ts   ← All enums, lookup tables, constants
└── index.ts             ← Barrel export of everything
```

### Why This Matters

```
Without shared package:
  API defines:  CreateProfileInput { fullName: string, age: number }
  Web defines:  ProfileForm { name: string, age: string }  ← different names!
  Result: runtime type mismatch, silent bugs

With shared package:
  packages/shared defines ONCE: CreateProfileInput { fullName: string, age: number }
  API imports → validates request body against it
  Web imports → validates form against it
  Result: if API changes the contract, TypeScript surfaces the error in the web build immediately
```

### Enums as the Single Source of Truth

All enums are defined once in `constants/enums.ts`:

```typescript
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CHURCH_ADMIN = 'CHURCH_ADMIN',
  PASTOR      = 'PASTOR',
  VENDOR      = 'VENDOR',
  READ_ONLY   = 'READ_ONLY',
}
```

This same enum is:
- Used by Prisma schema (as strings)
- Used by API middleware for role checks
- Used by frontend for conditional rendering
- Used by Zod schemas for validation

Change the enum in one place → TypeScript breaks everywhere it's used incorrectly.

### The `COUNSELLING_SESSIONS` Constant

```typescript
export const COUNSELLING_SESSIONS = [
  { session: 1, topic: 'Foundations of Marriage', duration: '90 mins', scripture: 'Genesis 2:18–25' },
  { session: 2, topic: 'Communication & Conflict', duration: '90 mins', scripture: 'Ephesians 4:25–32' },
  { session: 3, topic: 'Roles & Responsibilities', duration: '90 mins', scripture: 'Ephesians 5:22–33' },
  { session: 4, topic: 'Finances & Stewardship', duration: '60 mins', scripture: 'Proverbs 3:9–10' },
  { session: 5, topic: 'Family Planning & In-Laws', duration: '90 mins', scripture: 'Ruth 1:16–17' },
  { session: 6, topic: 'Spiritual Leadership & Prayer', duration: '60 mins', scripture: 'Joshua 24:15' },
];
```

This drives both the backend (counselling session validation) and the frontend (CounsellingPage module cards).

---

## 8. Authentication & Authorisation Flow

### Full Login Flow

```
Browser                          API Server                          Redis / DB
   │                                  │                                  │
   │── POST /auth/login ──────────────►│                                  │
   │   { email, password, mfaToken }   │                                  │
   │                                  │── SELECT user WHERE email ───────►│
   │                                  │◄─── user record ─────────────────│
   │                                  │                                  │
   │                                  │ 1. Check lockedUntil              │
   │                                  │ 2. bcrypt.compare(password)       │
   │                                  │ 3. If wrong: increment failedAttempts
   │                                  │    If 5+: set lockedUntil = now+30min
   │                                  │ 4. If MFA enabled: verify TOTP    │
   │                                  │ 5. Reset failedLoginAttempts = 0  │
   │                                  │                                  │
   │                                  │── SAVE session in Redis ─────────►│
   │                                  │   Key: session:{userId}:{sessionId}
   │                                  │                                  │
   │◄── 200 { accessToken, user } ────│                                  │
   │    Set-Cookie: refreshToken      │                                  │
   │    (httpOnly, SameSite=Strict)   │                                  │
```

### JWT Token Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    ACCESS TOKEN (RS256)                      │
│                    TTL: 15 minutes                           │
│                                                              │
│  Header:  { alg: "RS256", typ: "JWT" }                      │
│  Payload: { sub: userId, email, role, churchId, iat, exp }  │
│  Signature: signed with PRIVATE_KEY                         │
│                                                              │
│  Sent in: Authorization: Bearer <token>                      │
│  Stored in: Zustand memory (NOT localStorage)               │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                   REFRESH TOKEN (RS256)                      │
│                    TTL: 7 days                               │
│                                                              │
│  Payload: { sub: userId, sessionId, type: "refresh" }       │
│  Sent in: Set-Cookie (httpOnly, SameSite=Strict, Secure)    │
│  Stored in: Redis (key: session:{userId}:{sessionId})       │
│             + Browser httpOnly cookie                        │
│                                                              │
│  On use:  Verify token → Verify Redis session exists         │
│           → Issue new access token                           │
└────────────────────────────────────────────────────────────┘
```

### Role-Based Access Control (RBAC)

5 roles with hierarchical permissions:

```
SUPER_ADMIN
    │  Can do everything, including:
    │  ├── Approve/reject/suspend churches
    │  ├── See all data across all churches
    │  └── Access admin dashboard

CHURCH_ADMIN
    │  Can do everything within their church:
    │  ├── Approve profiles submitted by pastors
    │  ├── View all alliances involving their church
    │  └── Access church-level dashboard

PASTOR
    │  Standard user role:
    │  ├── Create and manage profiles in their church
    │  ├── Initiate and manage alliances
    │  ├── Register counselling sessions
    │  └── Access their own dashboard

VENDOR
    │  Limited access:
    │  ├── Submit and manage their vendor listing
    │  └── No access to matrimonial features

READ_ONLY
    └── Can view (no create/update/delete)
```

### Multi-Factor Authentication Flow

```
User enables MFA in settings:
  ├── API: generateSecret() → QR code URI → user scans with Google Authenticator
  ├── User enters 6-digit TOTP to confirm setup
  └── API: stores encrypted mfaSecret + encrypted backup codes

Subsequent logins:
  ├── POST /auth/login (email + password)
  │    └── Returns: { requiresMfa: true }
  ├── User reads their authenticator app
  └── POST /auth/mfa/verify (6-digit token)
       └── Returns: { accessToken, user } + sets refreshToken cookie
```

---

## 9. Real-Time Architecture (Socket.IO)

### Why WebSockets?

When Pastor A from Church 1 expresses interest in a profile from Church 2, Pastor B at Church 2 needs to know immediately — not on their next page refresh. WebSockets provide the push channel for this.

### Connection Architecture

```
Browser (Web)                      Socket.IO Server               Node Process
    │                                     │                            │
    │── WS connect ─────────────────────►│                            │
    │   ?token=<accessToken>              │                            │
    │   (or Authorization header)         │                            │
    │                                     │── jwt.verify(token) ──────►│
    │                                     │◄── { sub, role, churchId }─│
    │                                     │                            │
    │                                     │  socket.data.user = payload│
    │                                     │  socket.join(`user:${userId}`)
    │                                     │  (personal room)           │
    │◄── connected ───────────────────────│                            │
    │                                     │                            │
```

### Event Emission (Server → Client)

```typescript
// Anywhere in the API (service layer)
emitToUser(pastorId, 'notification:new', {
  id: notif.id,
  type: 'NEW_INTEREST',
  title: 'New Interest Received',
  body: 'A pastor has expressed interest in one of your profiles',
});

// Socket server
function emitToUser(userId: string, event: string, data: unknown) {
  if (!io) return; // graceful no-op if socket not initialised
  io.to(`user:${userId}`).emit(event, data);
}
```

### Events Taxonomy

| Event | Direction | Trigger |
|-------|-----------|---------|
| `notification:new` | Server → Client | Any notification created |
| `alliance:updated` | Server → Client | Alliance stage advanced |
| `profile:approved` | Server → Client | Admin approves a profile |

---

## 10. AI Integration Architecture

### AI Features

| Feature | What It Does | Input |
|---------|-------------|-------|
| **Smart Match** | Scores and ranks compatible profiles for a candidate | Profile data |
| **Draft Letter** | Generates a pastoral introduction letter for an alliance | Alliance + profiles |
| **Session Prep** | Generates discussion questions for a counselling session | Session number + topic |
| **Alliance Summary** | Summarises status and suggests next pastoral steps | Alliance data |
| **Pastoral Chat** | Freeform AI assistant for pastoral questions | Message + history |

### Request Flow

```
Browser (AIPanel)
    │
    │── POST /api/v1/ai/chat ──────────────────────────────────►│
    │   { message, history[] }                                   │
    │                                                            │
    │                               ┌────────────────────────┐  │
    │                               │  aiRateLimiter         │  │
    │                               │  Redis: ai:{userId}:{date}│
    │                               │  Max 50/day per user   │  │
    │                               └────────────┬───────────┘  │
    │                                            │ Under limit  │
    │                               ┌────────────▼───────────┐  │
    │                               │  AI Service            │  │
    │                               │  Build system prompt   │  │
    │                               │  + context injection   │  │
    │                               └────────────┬───────────┘  │
    │                                            │              │
    │                               ┌────────────▼───────────┐  │
    │                               │  Anthropic Claude API  │  │
    │                               │  claude-3-5-sonnet     │  │
    │                               └────────────┬───────────┘  │
    │                                            │              │
    │                               ┌────────────▼───────────┐  │
    │                               │  Log AIInteraction     │  │
    │                               │  (prompt, response,    │  │
    │                               │   tokensUsed, feature) │  │
    │                               └────────────┬───────────┘  │
    │                                            │              │
    │◄── { response: "..." } ────────────────────┘              │
```

### Cost Controls

```typescript
// Daily spend alert at $20 → email admin
// Hard spend limit at $50 → throw 429 error
// Per-user request limit: 50/day → Redis counter
// All interactions logged with tokensUsed for billing analytics
```

---

## 11. File Storage & Media Architecture

### Profile Photo Flow

OneFlesh uses **pre-signed S3 URLs** for direct browser-to-S3 uploads. The API never acts as a file upload proxy — this is the scalable pattern.

```
Step 1: Browser requests an upload URL
    Browser ──► POST /api/v1/uploads/profile-photo
                { profileId, contentType: "image/jpeg" }
    API     ──► Validates: file type must be image/*
    API     ──► Generates: S3 key = profiles/{profileId}/{uuid}.jpg
    API     ──► Returns:   { uploadUrl, key }  (URL expires in 5 min)

Step 2: Browser uploads directly to S3
    Browser ──► PUT {uploadUrl}   (direct to S3, not through API)
                Body: raw file bytes
                Header: Content-Type: image/jpeg
    S3      ──► 200 OK

Step 3: Browser confirms completion
    Browser ──► PATCH /api/v1/profiles/{id}/photo
                { key: "profiles/uuid/uuid.jpg" }
    API     ──► prisma.profile.update({ photoUrl: key })
```

**Why this pattern?**
- API server never buffers file bytes → no memory pressure
- S3 handles upload bandwidth, not the Node.js process
- Pre-signed URL expires → attacker cannot upload arbitrary files to arbitrary keys

### Photo Retrieval (Pre-Signed GET URLs)

Photos are stored privately in S3 (no public bucket ACL). To display a photo:

```typescript
const url = await getSignedUrl(
  s3Client,
  new GetObjectCommand({ Bucket: S3_BUCKET, Key: profile.photoUrl }),
  { expiresIn: 3600 } // URL valid for 1 hour
);
```

---

## 12. Infrastructure & Deployment

### Production Docker Stack

```
Host Machine (Ubuntu VPS)
└── Docker Engine
    ├── nginx          ← Port 80/443, TLS termination, SPA routing
    ├── api            ← Port 4000 (internal), Node.js Express
    ├── web            ← Port 80 (internal), static Nginx serving the Vite build
    ├── postgres       ← Port 5432 (internal), PostgreSQL 16
    ├── redis          ← Port 6379 (internal), Redis 7
    └── certbot        ← Runs on cron, renews Let's Encrypt certificates

All services on bridge network: 172.20.0.0/16
Named volumes: postgres_data, redis_data, certbot_conf, certbot_www
```

### Nginx Architecture

```
Client                  Nginx                      Docker Services
   │                      │
   │── GET /api/v1/* ─────►│── proxy_pass http://api:4000/api/v1/*
   │                      │
   │── GET /socket.io/* ──►│── proxy_pass http://api:4000/socket.io/*
   │                      │   (+ Upgrade: websocket headers)
   │                      │
   │── GET /* ────────────►│── proxy_pass http://web:80/
   │  (any other path)    │   (SPA: web server returns index.html for all paths)
   │                      │
   │── GET /health ───────►│── returns 200 OK directly (no upstream)
```

**Nginx also applies a second layer of rate limiting** (Nginx `limit_req`), complementing the Express/Redis rate limiting:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
```

### Development vs Production Environment

| Concern | Development | Production |
|---------|-------------|------------|
| Postgres port | 5433 (avoid conflicts) | 5432 (internal only) |
| Redis | No password | Password protected |
| Email | MailHog (port 8025 UI) | AWS SES |
| TLS | None | Let's Encrypt via Certbot |
| JWT keys | Auto-generated ephemeral | RSA 2048-bit from env vars |
| API key (Anthropic) | Optional (AI features disabled) | Required |
| Logging | debug level | info level |
| CORS | localhost:5173 | production domain only |

### VPS Setup (setup.sh)

The provisioning script automates a fresh Ubuntu VPS:
1. Docker + Docker Compose v2 installation
2. UFW firewall (SSH 22, HTTP 80, HTTPS 443 only)
3. `oneflesh` system user with docker group
4. systemd service for auto-start on reboot
5. 2GB swap file (for build operations)
6. Unattended security upgrades enabled

---

## 13. CI/CD Pipeline

### Pipeline Overview

```
Git Push / PR
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CI Workflow                              │
│                                                                  │
│  ┌──────────────────┐    ┌────────────────┐    ┌─────────────┐  │
│  │  Lint+Typecheck  │    │   Unit Tests   │    │Docker Build │  │
│  │  ESLint          │    │  Jest + PG     │    │API + Web    │  │
│  │  tsc --noEmit    │    │  + Redis svc   │    │(no push)    │  │
│  │  Prettier check  │    │                │    │             │  │
│  └────────┬─────────┘    └───────┬────────┘    └──────┬──────┘  │
│           │                      │                     │         │
│           └──────────────────────┼─────────────────────┘         │
│                                  ▼                               │
│                         ┌────────────────┐                      │
│                         │  CI Success    │  (aggregate check)   │
│                         └────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘

Push to main branch only:
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Deploy Workflow                            │
│                                                                  │
│  1. Build & push docker.io/oneflesh/api:latest + :sha           │
│  2. Build & push docker.io/oneflesh/web:latest + :sha           │
│     (with VITE_API_URL baked into the web build)                │
│                                                                  │
│  3. SSH to VPS:                                                  │
│     ├── docker compose pull                                      │
│     ├── docker compose exec api npx prisma migrate deploy        │
│     ├── docker compose up -d api web                             │
│     ├── nginx -s reload                                          │
│     └── docker image prune -f                                   │
│                                                                  │
│  4. Slack notification: ✅ Deployed sha:abc1234 / ❌ Failed      │
└─────────────────────────────────────────────────────────────────┘
```

### Key CI Design Decisions

**Concurrency lock on deploy:**
```yaml
concurrency:
  group: production-deploy
  cancel-in-progress: false  # Never cancel a running deploy
```
This prevents two simultaneous deploys that could leave the database in a mid-migration state.

**Prisma migrate deploy (not migrate dev):**
- `migrate dev` is for development (creates migration files)
- `migrate deploy` is for production (applies pending migrations, never modifies files)
- Runs inside the running API container to ensure the schema matches the container's Prisma client

**Image tagging strategy:**
- `latest` — for docker compose to pull
- `sha:` — for audit trail, rollback reference

---

## 14. Security Architecture

### Defence in Depth — The 7 Layers

```
Layer 1: TRANSPORT
  └── TLS 1.2/1.3 only (Nginx), HSTS (1 year, preload)
      OCSP stapling, perfect forward secrecy cipher suite

Layer 2: NETWORK
  └── Nginx rate limiting (Nginx limit_req)
      UFW firewall (only 80/443/22 open)
      All services internal-only (Docker bridge network)

Layer 3: APPLICATION GATEWAY
  └── CORS: FRONTEND_URL whitelist only
      Helmet: CSP, X-Frame-Options, X-Content-Type-Options
      Body size limit: 10KB (memory exhaustion protection)

Layer 4: RATE LIMITING (API)
  └── Redis-backed tiered limits:
      Auth: 10/15min, Password reset: 3/hr, AI: 50/day, General: 100/min

Layer 5: AUTHENTICATION
  └── RS256 JWT (asymmetric), 15-min access + 7-day refresh
      TOTP MFA (TOTP RFC 6238)
      Account lockout after 5 failed attempts
      Max 3 concurrent sessions

Layer 6: AUTHORISATION
  └── Role-based (5 roles), applied per-route
      Church-level data isolation (churchGuard middleware)
      Ownership checks (pastor must own profile to edit)

Layer 7: DATA
  └── Encryption at rest (5 personal fields per profile)
      Parameterised queries via Prisma (SQL injection prevention)
      Soft deletes (30-day retention before hard delete)
      Immutable audit log (SetNull on user delete, log persists)
```

### Audit Logging

16 audit actions are tracked with: `action`, `entityType`, `entityId`, `metadata (JSON)`, `ipAddress`, `userAgent`:

```
LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, PASSWORD_CHANGED, MFA_ENABLED,
PROFILE_CREATED, PROFILE_APPROVED, PROFILE_DELETED,
ALLIANCE_CREATED, ALLIANCE_ADVANCED, ALLIANCE_DISSOLVED,
CHURCH_REGISTERED, CHURCH_APPROVED, CHURCH_SUSPENDED,
VENDOR_CREATED, VENDOR_APPROVED
```

Audit logs are immutable in design — there is no `DELETE` or `UPDATE` route for `AuditLog`. User deletion sets `userId = NULL` (SetNull) but the log entry remains.

---

## 15. Core Business Flows

### Alliance Lifecycle (5-Stage State Machine)

```
STAGE 1: Interest Expressed
    │  Pastor A creates alliance (profile1 + profile2)
    │  Notification sent to Pastor B
    │
    ▼
STAGE 2: Evaluation
    │  Both pastors reviewing candidacy
    │  Notes added to alliance record
    │
    ▼
STAGE 3: Families Introduced
    │  Families have met
    │  Progresses after family meeting note
    │
    ▼
STAGE 4: Pre-Marital Counselling
    │  GATE: At least 1 counselling session must be registered
    │  6 sessions must all reach COMPLETED status
    │
    ▼  (Gate: all 6 sessions COMPLETED)
STAGE 5: Engagement / Completed
    │  Alliance status → COMPLETED
    └── or at any stage → DISSOLVED (reason not stored, per BRD)
```

### Church Onboarding Flow

```
Church Admin fills RegisterChurchPage form
    │
    ▼
POST /api/v1/churches/register
    │
    ▼
Church created (status: PENDING)
    │
    ▼
Super Admin sees pending church in Admin Dashboard
    │
    ├── APPROVE → Church status: APPROVED
    │              Church admin can now log in + add pastors
    │
    └── REJECT  → Church status: REJECTED
                  Rejection email sent via AWS SES
```

### Profile Approval Flow

```
Pastor creates profile (status: PENDING, not visible to others)
    │
    ▼
Church Admin reviews in Admin Dashboard
    │
    ├── APPROVE → Profile status: APPROVED
    │              Now visible in profile search
    │              Notification sent to pastor
    │
    └── REJECT  → Pastor receives notification
                  Can edit and resubmit
```

---

## 16. Environment Configuration

All environment variables are validated at startup by `envalid`. If a required variable is missing, the process exits immediately with a clear error.

### Complete Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | `development`, `test`, or `production` |
| `PORT` | No | `4000` | API server port |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS allowed origin |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection |
| `JWT_PRIVATE_KEY` | No (generated in dev) | `''` | RS256 private key (PEM, `\n` escaped) |
| `JWT_PUBLIC_KEY` | No (generated in dev) | `''` | RS256 public key (PEM, `\n` escaped) |
| `JWT_ACCESS_TTL` | No | `900` | Access token TTL in seconds |
| `JWT_REFRESH_TTL` | No | `604800` | Refresh token TTL in seconds |
| `AWS_REGION` | No | `ap-south-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | No | `''` | S3/SES access |
| `AWS_SECRET_ACCESS_KEY` | No | `''` | S3/SES secret |
| `AWS_S3_BUCKET` | No | `oneflesh-uploads` | S3 bucket name |
| `AWS_SES_FROM_EMAIL` | No | `noreply@oneflesh.in` | Sender email |
| `TWILIO_ACCOUNT_SID` | No | `''` | Twilio (SMS OTP) |
| `TWILIO_AUTH_TOKEN` | No | `''` | Twilio auth |
| `TWILIO_PHONE_NUMBER` | No | `''` | Twilio sender number |
| `ANTHROPIC_API_KEY` | No | `''` | Claude API key (AI disabled if empty) |
| `AI_DAILY_SPEND_ALERT` | No | `20` | USD spend alert threshold |
| `AI_DAILY_SPEND_LIMIT` | No | `50` | USD hard spend limit |
| `AI_DAILY_REQUEST_LIMIT` | No | `50` | Per-user daily request cap |
| `BCRYPT_ROUNDS` | No | `12` | Password hash cost |
| `MAX_LOGIN_ATTEMPTS` | No | `5` | Before account lockout |
| `ACCOUNT_LOCKOUT_MINUTES` | No | `30` | Lockout duration |
| `MAX_CONCURRENT_SESSIONS` | No | `3` | Max active sessions per user |
| `PROFILE_HARD_DELETE_DAYS` | No | `30` | Soft-delete retention period |
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_DIR` | No | `./logs` | Log file directory |

---

## 17. Architectural Decisions & Trade-offs

### Decision 1: Monorepo over Polyrepo

**Chosen:** Single npm workspaces monorepo with `apps/` and `packages/`.

**Why:**
- Shared types in `packages/shared` are the contract layer — both API and Web must agree on the same types at compile time, not runtime
- Atomic commits: a change to a shared schema can be committed alongside the API + web changes that depend on it
- Single `npm install` at root sets up the entire project

**Trade-off:** All code is in one repo. A security incident that exposes the repo exposes both frontend and backend source. In practice, the backend's secrets are in `.env` files (never committed), so source exposure alone is not a critical risk.

---

### Decision 2: Express over NestJS

**Chosen:** Express 4 with manual module organisation.

**Why:**
- Express is explicit — every middleware, every route, every error path is visible
- NestJS adds significant abstraction (decorators, DI containers, modules) that is valuable in very large teams but adds learning curve and "magic" for a focused platform
- The manual `routes → service` pattern achieves the same layering with less framework dependency

**Trade-off:** More boilerplate for routing and DI. Would revisit NestJS if the team grows beyond ~5 backend engineers.

---

### Decision 3: Prisma over Raw SQL or Knex

**Chosen:** Prisma 5 as the ORM.

**Why:**
- Complete SQL injection prevention (parameterised queries, always)
- TypeScript-first — `prisma.profile.findMany()` returns typed `Profile[]`, not `any[]`
- Prisma Migrate for schema version control and deployment
- Prisma Studio for data inspection during development

**Trade-off:** Prisma's query API is less flexible than raw SQL for complex analytical queries. Mitigated by using `prisma.$queryRaw` with template literals (safe parameterisation) for dashboard aggregations.

---

### Decision 4: JWT (Stateless) + Redis Sessions (Stateful) Hybrid

**Chosen:** Short-lived access tokens (stateless JWT) + refresh token validated against Redis (stateful).

**Why:**
- Pure stateless JWT cannot be revoked — if a pastor is compromised, their token remains valid until expiry
- Pure stateful sessions require a database lookup on every request
- The hybrid: access tokens are 15 minutes (low damage window), refresh tokens are validated against Redis (can be revoked instantly by deleting the Redis key)

**Trade-off:** Redis becomes a dependency for auth. If Redis is unavailable, refresh will fail. Mitigated by Redis AOF persistence and restart policies.

---

### Decision 5: AWS S3 Pre-Signed URLs over API Proxying

**Chosen:** Browser uploads directly to S3 via pre-signed URL; API only generates the URL.

**Why:**
- The API process never buffers photo data in memory (photos can be 2–5MB each)
- S3 handles upload bandwidth/throughput natively
- Pre-signed URLs have a 5-minute expiry, preventing abuse

**Trade-off:** The browser needs CORS configured on the S3 bucket to allow direct PUT requests. This is a one-time bucket configuration step.

---

### Decision 6: `packages/shared` Schemas in Both API and Web

**Chosen:** Same Zod schemas validate on both frontend (UX) and backend (security).

**Why:**
- DRY: validation logic defined once, not duplicated
- Consistency: the UI form and the API endpoint accept exactly the same inputs
- Developer experience: changing a schema produces TypeScript errors in both places simultaneously

**Trade-off:** A frontend build is required to verify backend schema changes haven't broken the web layer. This is caught in CI.

---

*Document version 1.0 · OneFlesh Reformed Church Matrimonial Platform · May 2026*  
*Architecture authored by Zaneta Engineering*
