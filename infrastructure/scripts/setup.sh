#!/usr/bin/env bash
# ============================================================
# OneFlesh — Production Server Setup Script
# Tested on: Ubuntu 22.04 LTS
# Run as root on a fresh VPS.
# ============================================================

set -euo pipefail
IFS=$'\n\t'

DOMAIN="${1:-oneflesh.in}"
APP_DIR="/opt/oneflesh"
APP_USER="oneflesh"

echo "╔════════════════════════════════════════╗"
echo "║  OneFlesh Production Setup             ║"
echo "║  Domain: ${DOMAIN}                     ║"
echo "╚════════════════════════════════════════╝"

# ── 1. System update ──────────────────────────────────────
echo "[1/9] Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Install Docker & Docker Compose ────────────────────
echo "[2/9] Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

if ! command -v docker compose &>/dev/null; then
  DOCKER_COMPOSE_VERSION="2.27.0"
  curl -SL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

# ── 3. Create app user ────────────────────────────────────
echo "[3/9] Creating application user..."
if ! id "${APP_USER}" &>/dev/null; then
  useradd --system --shell /bin/bash --create-home --home-dir /home/${APP_USER} ${APP_USER}
fi
usermod -aG docker ${APP_USER}

# ── 4. Install Node.js 20 ─────────────────────────────────
echo "[4/9] Installing Node.js 20 LTS..."
if ! command -v node &>/dev/null || [[ "$(node --version)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# ── 5. Setup application directory ───────────────────────
echo "[5/9] Setting up application directory..."
mkdir -p "${APP_DIR}"
chown ${APP_USER}:${APP_USER} "${APP_DIR}"

# ── 6. Firewall (ufw) ─────────────────────────────────────
echo "[6/9] Configuring firewall..."
if command -v ufw &>/dev/null; then
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow ssh
  ufw allow http
  ufw allow https
  ufw --force enable
fi

# ── 7. Create systemd service ─────────────────────────────
echo "[7/9] Creating systemd service..."
cat > /etc/systemd/system/oneflesh.service << 'EOF'
[Unit]
Description=OneFlesh Application Stack
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=oneflesh
WorkingDirectory=/opt/oneflesh
ExecStart=/usr/local/bin/docker compose -f infrastructure/docker-compose.yml up -d --remove-orphans
ExecStop=/usr/local/bin/docker compose -f infrastructure/docker-compose.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable oneflesh

# ── 8. Swap space (for small VPS) ────────────────────────
echo "[8/9] Configuring swap..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── 9. Unattended upgrades ────────────────────────────────
echo "[9/9] Enabling automatic security updates..."
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

echo ""
echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "  1. Clone the repository:  git clone <repo-url> ${APP_DIR}"
echo "  2. Copy secrets:          cp .env.example ${APP_DIR}/.env && nano ${APP_DIR}/.env"
echo "  3. Obtain TLS cert:       bash ${APP_DIR}/infrastructure/scripts/certbot-init.sh ${DOMAIN}"
echo "  4. Run migrations:        docker compose -f infrastructure/docker-compose.yml run --rm api npx prisma migrate deploy"
echo "  5. Start the app:         systemctl start oneflesh"
