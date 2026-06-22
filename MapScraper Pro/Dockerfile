# ── MapScraper Pro — Frontend (Nginx) ────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all frontend static files
COPY . /usr/share/nginx/html/

EXPOSE 8180
