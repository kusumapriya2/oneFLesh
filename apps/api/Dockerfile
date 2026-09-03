# ============================================================
# OneFlesh API — Multi-stage Dockerfile
# ============================================================

# ── Stage 1: deps ─────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=apps/api --workspace=packages/shared

# ── Stage 2: build ────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
COPY tsconfig.json ./

# Build shared package first, then API
RUN npm run build -w packages/shared && \
    npm run build -w apps/api

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# ── Stage 3: production ───────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production

# Only production deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=apps/api --workspace=packages/shared --omit=dev && \
    npm cache clean --force

# Copy built artefacts
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY apps/api/src/prisma/schema.prisma ./apps/api/src/prisma/schema.prisma

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs api
USER api

WORKDIR /app/apps/api

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/v1/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
