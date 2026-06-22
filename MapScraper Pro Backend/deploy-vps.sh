#!/bin/bash
# ============================================================
#  MapScraper Pro — VPS Deploy Script (Ubuntu 22.04 / 24.04)
#  Run this once on your server as ROOT:
#    bash deploy-vps.sh yourdomain.com
# ============================================================
set -e

DOMAIN="${1:-yourdomain.com}"
APP_DIR="/opt/mapscraper-backend"
WEB_DIR="/var/www/mapscraper"
SERVICE="mapscraper-backend"

echo ""
echo "=============================="
echo " MapScraper Pro — VPS Deploy"
echo " Domain: $DOMAIN"
echo "=============================="
echo ""

# ── 1. System packages ────────────────────────────────────────
echo "[1/9] Installing system packages..."
apt-get update -q
apt-get install -y -q python3 python3-pip python3-venv nginx certbot python3-certbot-nginx \
    curl unzip git libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2

# ── 2. Create directories ─────────────────────────────────────
echo "[2/9] Creating directories..."
mkdir -p "$APP_DIR" "$WEB_DIR"

# ── 3. Copy backend files ─────────────────────────────────────
echo "[3/9] Copying backend files..."
cp main.py scraper.py requirements.txt "$APP_DIR/"

# ── 4. Python venv + pip install ──────────────────────────────
echo "[4/9] Installing Python dependencies..."
python3 -m venv "$APP_DIR/venv"
"$APP_DIR/venv/bin/pip" install --upgrade pip -q
"$APP_DIR/venv/bin/pip" install -r "$APP_DIR/requirements.txt" -q

# ── 5. Playwright browsers ────────────────────────────────────
echo "[5/9] Installing Playwright Chromium..."
"$APP_DIR/venv/bin/playwright" install chromium --with-deps

# ── 6. systemd service ────────────────────────────────────────
echo "[6/9] Creating systemd service..."
cat > /etc/systemd/system/${SERVICE}.service << EOF
[Unit]
Description=MapScraper Pro Backend (Playwright)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

chown -R www-data:www-data "$APP_DIR"
systemctl daemon-reload
systemctl enable "$SERVICE"
systemctl start "$SERVICE"
echo "   Backend service started."

# ── 7. Nginx config ───────────────────────────────────────────
echo "[7/9] Configuring Nginx..."
cat > /etc/nginx/sites-available/mapscraper << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Static frontend
    root $WEB_DIR;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy (SSE-friendly)
    location /api/ {
        proxy_pass         http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   Connection '';
        proxy_buffering    off;
        proxy_cache        off;
        chunked_transfer_encoding on;
        proxy_read_timeout 300s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
EOF

ln -sf /etc/nginx/sites-available/mapscraper /etc/nginx/sites-enabled/mapscraper
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "   Nginx configured."

# ── 8. SSL with Certbot ───────────────────────────────────────
echo "[8/9] Setting up SSL (Let's Encrypt)..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
    --non-interactive --agree-tos --email "admin@$DOMAIN" \
    --redirect
echo "   SSL certificate installed."

# ── 9. Done ───────────────────────────────────────────────────
echo ""
echo "=============================="
echo " Deploy Complete!"
echo "=============================="
echo ""
echo " Frontend URL : https://$DOMAIN"
echo " Backend API  : https://$DOMAIN/api/v1/health"
echo " Backend logs : journalctl -fu $SERVICE"
echo ""
echo " NEXT STEP: Upload your frontend files to $WEB_DIR"
echo "   scp -r 'MapScraper Pro/'* root@YOUR_VPS_IP:$WEB_DIR/"
echo ""
