#!/usr/bin/env bash
# ============================================================
# OneFlesh — Development Database Seed Script
# Run from project root after `npm run dev` backing services
# are healthy.
# ============================================================

set -euo pipefail

echo "🌱 Seeding OneFlesh development database..."

# Ensure dev services are running
if ! docker compose -f infrastructure/docker-compose.dev.yml ps --status running | grep -q postgres; then
  echo "⚠️  Postgres dev container is not running."
  echo "    Start it first: docker compose -f infrastructure/docker-compose.dev.yml up -d"
  exit 1
fi

# Apply pending migrations
echo "  → Running Prisma migrations..."
npm run db:migrate -w apps/api

# Generate Prisma client
echo "  → Generating Prisma client..."
npm run db:generate -w apps/api

# Run seed
echo "  → Seeding data..."
npm run db:seed -w apps/api

echo ""
echo "✅ Database seeded!"
echo ""
echo "Default credentials:"
echo "  Super Admin : admin@oneflesh.in  / Admin@OneFlesh2025!"
echo "  Pastor      : pastor@grace-reformed.in  / Pastor@OneFlesh2025!"
echo ""
echo "MailHog UI (captured emails): http://localhost:8025"
echo "Redis Commander:              http://localhost:8081"
echo "Prisma Studio:                npm run db:studio -w apps/api"
