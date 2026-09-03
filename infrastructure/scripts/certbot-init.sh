#!/usr/bin/env bash
# ============================================================
# OneFlesh — Certbot Initial TLS Certificate Setup
# Run once on a fresh production server after DNS is pointed.
# ============================================================

set -euo pipefail

DOMAIN="${1:-oneflesh.in}"
EMAIL="${2:-contact@oneflesh.in}"

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Usage: $0 <domain> <email>"
  exit 1
fi

echo "🔒 Obtaining TLS certificate for ${DOMAIN}..."

# Start nginx in HTTP-only mode first so certbot webroot challenge works
docker compose -f infrastructure/docker-compose.yml up -d nginx

# Run certbot
docker run --rm \
  -v "$(pwd)/infrastructure/certbot/certs:/etc/letsencrypt" \
  -v "$(pwd)/infrastructure/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    -d "${DOMAIN}" \
    -d "www.${DOMAIN}"

echo ""
echo "✅ TLS certificate obtained!"
echo "   Reload nginx: docker compose -f infrastructure/docker-compose.yml exec nginx nginx -s reload"
