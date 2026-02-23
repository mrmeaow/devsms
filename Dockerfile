FROM node:22-bookworm AS build
WORKDIR /app
RUN corepack enable
RUN apt-get update && apt-get install -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

# -------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN corepack enable

ENV NODE_ENV=production

# Copy workspace metadata
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json

# Install runtime deps (compile better-sqlite3 here)
RUN apt-get update && apt-get install -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/* \
  && pnpm install --prod --frozen-lockfile

# Copy build artifacts
COPY --from=build /app/apps/server ./apps/server
COPY --from=build /app/apps/web ./apps/web
COPY scripts/start.sh ./scripts/start.sh

# Rebuild for better-sqlite3 shits :)
RUN pnpm app:server rebuild

EXPOSE 4000 5153
CMD ["bash", "./scripts/start.sh"]
