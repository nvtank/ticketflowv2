#!/usr/bin/env bash
set -euo pipefail
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
python3 -m py_compile scripts/github/sync-backlog.py scripts/github/sync-project.py
python3 scripts/github/sync-backlog.py
python3 scripts/github/sync-project.py
git diff --check
