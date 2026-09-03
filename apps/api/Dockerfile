# ============================================================
# OneFlesh API — Multi-stage Dockerfile
# ============================================================

# ── Stage 1: deps ─────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy workspace manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# ── Stage 2: build ────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
COPY tsconfig.json ./

# Generate Prisma client before TypeScript compilation.
WORKDIR /app/apps/api
RUN DATABASE_URL=postgresql://localhost:5432/build \
    DIRECT_URL=postgresql://localhost:5432/build \
    pnpm exec prisma generate

# Build shared package first, then API
WORKDIR /app
RUN pnpm run build -w packages/shared && \
    pnpm run build -w apps/api

# ── Stage 3: production ───────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

ENV NODE_ENV=production

# Only production deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/api/src/prisma/schema.prisma ./apps/api/src/prisma/schema.prisma
COPY apps/api/src/prisma/migrations ./apps/api/src/prisma/migrations

RUN DATABASE_URL=postgresql://localhost:5432/build \
    DIRECT_URL=postgresql://localhost:5432/build \
    pnpm install --frozen-lockfile --prod && \
    pnpm store prune

# Copy built artefacts
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs api && \
    mkdir -p /app/apps/api/logs && \
    chown -R api:nodejs /app/apps/api
USER api

WORKDIR /app/apps/api

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/v1/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
