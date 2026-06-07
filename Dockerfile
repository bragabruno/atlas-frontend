# syntax=docker/dockerfile:1

# ─── Stage 1: build ──────────────────────────────────────────────────────────
# node:22.16.0-alpine3.22 — pushed 2025-05-31 (≥14 days as of 2026-06-07)
FROM node:22.16.0-alpine3.22 AS build

WORKDIR /app

# Install dependencies first (layer-cache friendly: copy lock files before src)
COPY package.json package-lock.json ./

# npm ci: clean install from lock file, no network beyond this layer
RUN npm ci --ignore-scripts

# Copy source and build for production
COPY . .

# ng build defaults to production configuration (outputHashing=all)
# Output lands in dist/atlas-frontend/browser/
RUN npx ng build --configuration production

# ─── Stage 2: runtime ────────────────────────────────────────────────────────
# nginx:1.27.5-alpine3.21 — pushed 2025-04-16 (≥14 days as of 2026-06-07)
FROM nginx:1.27.5-alpine3.21 AS runtime

# Remove the default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Drop-in the Atlas SPA config
COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/atlas.conf

# Copy the Angular production build artefacts from the build stage
COPY --from=build /app/dist/atlas-frontend/browser /usr/share/nginx/html

# nginx runs as root by default; we expose port 8080 so the container can run
# as non-root in AKS (port <1024 requires CAP_NET_BIND_SERVICE).
# The nginx.conf listens on 8080.
EXPOSE 8080

# Healthcheck — liveness probe uses this in local docker run scenarios
# (AKS uses the Rollout probe spec; this is belt-and-suspenders for local use)
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
