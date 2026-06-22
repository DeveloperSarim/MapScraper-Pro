# MapScraper Pro v20

Google Maps business data extractor with a FastAPI + Playwright backend and a static HTML/React frontend.

## Architecture

```
Port 8180 (public)
    └── Nginx (frontend)
            ├── Serves  static HTML/JS/CSS
            └── Proxies /api/* → backend:8100 (internal)
                                    └── FastAPI + Playwright (Chromium)
```

## 🐳 Deploy with Docker Compose (VPS)

### Requirements
- Docker ≥ 24
- Docker Compose ≥ 2

### One-command deploy

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/mapscraper-pro.git
cd mapscraper-pro

# Build & start (first run downloads Chromium ~300MB)
docker compose up -d --build

# Check logs
docker compose logs -f
```

App is now live at → **http://YOUR_VPS_IP:8180**

### Useful commands

| Action | Command |
|--------|---------|
| Start | `docker compose up -d` |
| Stop | `docker compose down` |
| Rebuild | `docker compose up -d --build` |
| Backend logs | `docker compose logs -f backend` |
| Frontend logs | `docker compose logs -f frontend` |
| Shell into backend | `docker compose exec backend bash` |

### Ports

| Service | Container Port | Host Port |
|---------|---------------|-----------|
| Frontend (Nginx) | 8180 | **8180** |
| Backend (FastAPI) | 8100 | internal only |

> The backend is NOT exposed to the host — only the frontend Nginx container can reach it.
> Change the host port in `docker-compose.yml` if `8180` is already taken on your VPS.

## 🖥️ Run Locally (without Docker)

```bash
# Backend
cd "MapScraper Pro Backend"
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (separate terminal)
cd "MapScraper Pro"
python3 -m http.server 8788
# Open http://localhost:8788
```
