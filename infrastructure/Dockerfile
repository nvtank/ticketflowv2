# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:24-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9
FROM ${NODE_IMAGE} AS dependencies
WORKDIR /workspace
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/config/package.json ./packages/config/package.json
RUN pnpm install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @tixflow/shared build

FROM dependencies AS api-build
RUN pnpm --filter @tixflow/api build \
    && pnpm --filter @tixflow/api deploy --prod /out/api

FROM dependencies AS web-build
# Internal origin is baked into Next rewrites. No secret is passed as a build arg.
ARG API_INTERNAL_URL=http://api:4100
# Empty Socket.IO origin uses the browser's HTTPS origin via the reverse proxy.
ENV API_INTERNAL_URL=${API_INTERNAL_URL} NEXT_PUBLIC_REALTIME_URL=""
RUN pnpm --filter @tixflow/web build

FROM ${NODE_IMAGE} AS api
ARG VCS_REF=unknown
LABEL org.opencontainers.image.revision=${VCS_REF}
WORKDIR /app
ENV NODE_ENV=production API_HOST=0.0.0.0 API_PORT=4100
COPY --from=api-build --chown=node:node /out/api ./
USER node
EXPOSE 4100
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:4100/api/v1/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]

FROM ${NODE_IMAGE} AS web
ARG VCS_REF=unknown
LABEL org.opencontainers.image.revision=${VCS_REF}
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3100
COPY --from=web-build --chown=node:node /workspace/apps/web/.next/standalone ./
COPY --from=web-build --chown=node:node /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-build --chown=node:node /workspace/apps/web/public ./apps/web/public
USER node
EXPOSE 3100
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:3100/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]

# Explicit one-shot migration job; runtime images contain no Prisma CLI.
FROM api-build AS migrate
ENV NODE_ENV=production
USER node
WORKDIR /workspace/apps/api
ENTRYPOINT ["pnpm", "exec", "prisma", "migrate", "deploy"]
