#!/usr/bin/env bash
set -euo pipefail

# Run with Node 24 and pnpm available. NixOS may set PRISMA_SCHEMA_ENGINE_BINARY.
# Test Compose has its own project and ephemeral database; no production target is used.
pnpm env:setup
pnpm db:generate
pnpm --filter @tixflow/shared build
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
pnpm build
pnpm test:infra:up
pnpm test:db:prepare
pnpm test:integration
pnpm audit --audit-level=high
git diff --check
