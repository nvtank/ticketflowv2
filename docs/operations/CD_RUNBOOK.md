# CD runbook (TF2-039)

`.github/workflows/cd.yml` has three jobs:

1. **`local-rollout-demo`** — runs on every push to `main` and on manual
   dispatch. Deploys a known-good release to the local
   `docker-compose.staging.yml` stack, then deploys a release with a
   deliberately broken `DATABASE_URL` override and proves
   `scripts/deploy/rollout.py` detects the failed health gate and
   automatically rolls back to the previous release. No AWS, no remote
   host. Evidence:
   [`evidence/cd-rollout-2026-11-11.json`](evidence/cd-rollout-2026-11-11.json).
2. **`deploy-production`** — the real remote deploy. Gated three
   independent ways:
   - `environment: production` — requires reviewer approval configured in
     GitHub repo **Settings → Environments** (not in this YAML file).
   - `if: vars.AWS_DEPLOY_ROLE_ARN != ''` — skipped entirely, not failed,
     until that repository/environment variable is actually set to the
     `deploy_role_arn` output of TF2-038's Terraform after a reviewed
     `apply`.
   - `permissions: id-token: write` only grants the ability to request an
     OIDC token; the AWS side still enforces the trust policy from
     `infrastructure/aws/oidc.tf` (repo + environment scoped).
   - When it does run, it builds the three images, pushes each to its ECR
     repository tagged with the commit SHA, resolves the **registry
     digest** (`docker inspect --format='{{index .RepoDigests 0}}'`), and
     writes that exact digest to an SSM parameter
     (`/tixflow-v2/<env>/deploy/<service>-digest`) — never a mutable tag.
3. **`migration-restore-gate`** — never runs on a push. It requires a
   human to run `workflow_dispatch` with
   `confirm_migration_restore: yes` **and** approval of the separate,
   more restrictive `production-migration` environment. It then runs the
   existing isolated-database restore drill
   (`scripts/backup-restore-drill.mjs`, from TF2-040) — never against a
   real database.

## Rollback today

There is no provisioned compute target yet that consumes the `*-digest`
SSM parameters (out of scope of TF2-038/039; a follow-up ticket should add
one, e.g. ECS or App Runner reading that parameter on deploy). Until then,
"rollback" for a real deploy means: redeploy using the previous value of
the relevant `*-digest` SSM parameter, which `deploy-production` never
overwrites anywhere except by that one `put-parameter` call — so the
previous value is always recoverable from SSM parameter history
(`aws ssm get-parameter-history`). The state machine that _would_ drive an
automatic version of this (deploy → health-check → rollback-on-failure) is
exactly what `scripts/deploy/rollout.py` already proves locally.

## Running the local demo yourself

```sh
python3 scripts/setup-staging.py   # or reuse an existing .local/staging/runtime.env
docker compose --env-file .local/staging/runtime.env -f infrastructure/docker-compose.staging.yml build
python3 scripts/deploy/rollout.py "$(git rev-parse --short HEAD)"
python3 scripts/deploy/rollout.py "$(git rev-parse --short HEAD)-bad" --demo-failure
docker compose --env-file .local/staging/runtime.env -f infrastructure/docker-compose.staging.yml down --remove-orphans
```

State persists in `.local/deploy/state.json`; the last run's report is
`.local/deploy/rollout-report.json`.
