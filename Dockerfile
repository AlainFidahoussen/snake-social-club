# syntax=docker/dockerfile:1

# --- Frontend build --------------------------------------------------------
FROM node:22-slim AS frontend-build
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
# --legacy-peer-deps: @lovable.dev/vite-tanstack-config's peerDependency range on `nitro` only
# matches its own exact beta patch version (a semver quirk with date-based prerelease patches),
# so it rejects the newer nitro pinned in package.json even though it resolves fine in practice.
RUN npm ci --legacy-peer-deps

COPY frontend/ ./
# Nitro's static preset currently exits non-zero after prerendering due to an upstream bug
# (https://github.com/nitrojs/nitro/issues/3843); the prerendered files are already written
# correctly by that point, so verify the real output instead of trusting the exit code.
RUN npm run build; test -f .output/public/index.html

# --- Backend ----------------------------------------------------------------
FROM python:3.13-slim AS backend
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app/backend

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --locked --no-dev

COPY backend/app ./app
COPY --from=frontend-build /app/frontend/.output/public /app/frontend_dist
RUN mkdir -p /app/data

ENV FRONTEND_DIST_DIR=/app/frontend_dist
ENV DATABASE_URL=sqlite:////app/data/snake_social_club.db

EXPOSE 8000
CMD ["uv", "run", "--no-sync", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
