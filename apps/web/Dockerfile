# ============================================================
# OneFlesh Web — Multi-stage Dockerfile
# ============================================================

# ── Stage 1: deps ─────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN npm ci --workspace=apps/web --workspace=packages/shared

# ── Stage 2: build ────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
COPY tsconfig.json ./

# Build shared first (needed as workspace dep), then Vite build
RUN npm run build -w packages/shared && \
    npm run build -w apps/web

# ── Stage 3: serve with Nginx ─────────────────────────────
FROM nginx:1.27-alpine AS production

RUN addgroup --system --gid 1001 webuser && \
    adduser --system --uid 1001 --ingroup webuser --no-create-home webuser

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# SPA router: all unknown paths → index.html
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 '{"status":"ok"}';
        add_header Content-Type application/json;
    }
}
EOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
