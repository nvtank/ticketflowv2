# syntax=docker/dockerfile:1
#
# Render-specific build of apps/api. Render's Docker deploy does not support
# selecting a --target stage in a multi-stage Dockerfile (it always builds the
# final stage) — see https://community.render.com/t/specify-a-target-build-stage-for-multi-stage-dockerfile/2219.
# infrastructure/Dockerfile's final stage is `migrate`, a one-shot job, not
# the API server, so it cannot be pointed at directly from Render.
#
# This file mirrors infrastructure/Dockerfile's dependencies -> api-build ->
# api chain verbatim, just ending at `api` as the last stage. Build context on
# Render must be the repository root, same as the shared Dockerfile.
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
