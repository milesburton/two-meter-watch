# syntax=docker/dockerfile:1

FROM node:26-bookworm-slim AS build
WORKDIR /app

# python3/make/g++ are needed to build better-sqlite3's native addon when no
# prebuilt binary matches this platform.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build:ui || true
RUN npm run version:generate || true

FROM node:26-bookworm-slim AS final
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends rtl-sdr \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system app && useradd --system --gid app --create-home app

# node_modules is copied as-built from the build stage (native addons
# already compiled there) rather than reinstalled here, avoiding the need
# for build tooling (python3/make/g++) in the final image.
COPY --from=build --chown=app:app /app /app

# ./data (sqlite) and ./images (future SSTV output) must be writable by the
# non-root "app" user this container runs as.
RUN mkdir -p /app/data /app/images && chown -R app:app /app/data /app/images

USER app

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npx", "tsx", "src/backend/cli/main.ts", "serve"]
