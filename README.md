# MapScraper Pro v20

Google Maps business data extractor — FastAPI + Playwright backend, static HTML/React frontend.

## Architecture

```
maps.sarimtools.com (port 443 HTTPS)
    └── Caddy (auto SSL via Let's Encrypt)
            └── Nginx frontend (internal: 8180)
                    └── /api/* proxied → FastAPI backend (internal: 8100)
                                              └── Playwright / Chromium
```

---

## 🐳 Deploy on VPS with Domain (maps.sarimtools.com)

### Step 1 — DNS Setup (Cloudflare / Domain Registrar)

Add this DNS A record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | maps | `147.93.122.121` | Auto |

> Wait 2–5 minutes for DNS to propagate.

### Step 2 — VPS Setup

```bash
# SSH into your VPS
ssh root@147.93.122.121

# Clone the repo
git clone https://github.com/DeveloperSarim/MapScraper-Pro.git
cd MapScraper-Pro

# IMPORTANT: Make sure ports 80 and 443 are free
# Check what's using them:
lsof -i :80
lsof -i :443
# If another nginx/caddy is running on the VPS, stop it first:
# systemctl stop nginx   (if host nginx is running)

# Build and start everything
docker compose up -d --build

# Caddy will auto-fetch SSL cert for maps.sarimtools.com
# This takes ~30 seconds on first start
docker compose logs -f caddy
```

### Step 3 — Verify

```bash
# Check all containers running
docker compose ps

# Test SSL
curl https://maps.sarimtools.com/api/v1/health
# Expected: {"status":"ok","backend":"playwright"}
```

🎉 App live at: **https://maps.sarimtools.com**

---

## 🔄 Update Deployment

```bash
cd MapScraper-Pro
git pull
docker compose up -d --build
```

---

## 📋 Useful Commands

| Action | Command |
|--------|---------|
| Start | `docker compose up -d` |
| Stop | `docker compose down` |
| Rebuild | `docker compose up -d --build` |
| All logs | `docker compose logs -f` |
| Backend logs | `docker compose logs -f backend` |
| Caddy SSL logs | `docker compose logs -f caddy` |
| Shell into backend | `docker compose exec backend bash` |

---

## 🖥️ Run Locally (no Docker)

```bash
# Backend
cd "MapScraper Pro Backend"
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (new terminal)
cd "MapScraper Pro"
python3 -m http.server 8788
# Open http://localhost:8788
```

---

## ⚠️ Port Conflict Note

If ports 80/443 are already used by another app on your VPS (e.g., Nginx Proxy Manager), see `docs/nginx-host-proxy.md` for the alternative setup.
