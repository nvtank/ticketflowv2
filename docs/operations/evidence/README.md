# TF2-037 / TF2-026 local technical evidence

Actual operator and commit author: nvtank. Date: 05 November 2026. These are production-mode local containers, not a public release or a human acceptance record.

- `staging-2026-11-05.json`: 24 passing real-container checks, actual timestamps, tested worktree revision, immutable image IDs and the limitations of the earlier build-base labels. All three images built successfully; all ten migrations were applied to the isolated staging DB on first startup and later runs completed without pending migrations.
- `api-log-sample.txt`: actual request-ID/status/duration log samples, including readiness 503 during a deliberate Redis outage and recovery 200; passwords/tokens/runtime secrets were checked against the captured API log and were absent.
- Application checks: 131 unit tests across 12 files passed; workspace lint, typecheck and formatting passed. The added API_HOST test checks safe loopback defaults, explicit container binding and invalid-host rejection. Production Next build compiled and generated 27 static pages; actual HTTPS delivery of standalone browser assets passed.
- The required GitHub quality workflow additionally builds and tests this stack using the checked-out PR commit, then removes containers while retaining volumes. It also retains the existing integration/browser suite. CI status must be read from the actual PR checks; local results do not imply CI already passed.

TF2-037 is technically implemented and locally verified, pending independent approval/required CI/merge. TF2-026 has local readiness/error-log evidence, runbook and Review/Retro preparation; approved **public HTTPS and an actual team Review/Retro remain pending**. No stakeholder signature, payment settlement, AWS provision or DNS change occurred.

Runtime keys, environment file, bearer tokens, passwords and local CA private keys are excluded. The local CA root certificate is not submitted as a public trust certificate. Registry digests are empty for locally built app images; image IDs identify the exact tested local artifacts.

# TF2-038 AWS IaC static validation

Actual operator and commit author: nvtank. Date: 11 November 2026. This is static Terraform validation only — no AWS account was reachable from this environment, and no `apply` was run.

- `aws-iac-validate-2026-11-11.json`: `terraform fmt -check`, `terraform validate` (0 errors), and a credential-less `terraform plan`, which fails with "No valid credential sources found" as expected — that failure is the evidence that apply cannot happen by accident, not a bug. See [`../AWS_RUNBOOK.md`](../AWS_RUNBOOK.md) for the gated procedure to actually provision this.
- No AWS resource, ECR repository, SSM parameter, KMS key, VPC, or DNS record exists anywhere as a result of this work. Status is `VALIDATED_NO_APPLY`.

# TF2-039 local rollout/rollback evidence

Actual operator and commit author: nvtank. Date: 11 November 2026. Local `docker-compose.staging.yml` stack only — no AWS, no remote host.

- `cd-rollout-2026-11-11.json`: `scripts/deploy/rollout.py` deployed a known-good release (healthy), then deployed a release with a deliberately broken `DATABASE_URL` override; Docker Compose reported `dependency failed to start: container ticketflowv2-staging-api-1 is unhealthy`, the script detected the failed health gate and automatically redeployed the previous release, which recovered to healthy. Final state and both releases' image IDs/config hash are recorded.
- The real remote deploy job (`deploy-production` in `.github/workflows/cd.yml`) is gated on the `production` GitHub environment and an `AWS_DEPLOY_ROLE_ARN` repository variable that is not set; it is skipped, not faked, until TF2-038's IaC is actually applied and approved. The `migration-restore-gate` job requires an explicit `workflow_dispatch` confirmation plus a separate `production-migration` environment approval, and only then runs the existing isolated-DB restore drill from TF2-040.

# TF2-050 apps/api connected to Supabase PostgreSQL

Actual operator and commit author: nvtank. Date: 14 November 2026. Decision recorded in [CR-20261114-004](../../qlda/changes/CR-20261114-004-supabase-postgres.md).

- `supabase-migrate-2026-11-14.json`: the operator created a Supabase project and set `DATABASE_URL` to its **Session pooler** connection string (IPv4, persistent-connection compatible — the correct mode for `apps/api`'s long-running process, not the Transaction pooler) directly in their local `.env`. The value was never pasted into chat and is not printed by any command recorded here.
- Running `prisma migrate deploy` directly on this NixOS dev machine fails for a reason unrelated to Supabase: Prisma's CLI looks for a prebuilt engine for a `linux-nixos` target that upstream does not publish (the same 404 already seen while verifying the Vercel build fix), and a nix-store `prisma-engines` package found locally is a different major version (6.18.0) than the installed Prisma CLI (7.10.1), which is incompatible rather than just missing.
- Workaround: built the existing `migrate` target in `infrastructure/Dockerfile` (base image `node:24-bookworm-slim`, a normal Debian target Prisma ships real binaries for) and ran it once with `docker run --env-file .env <image>`, which is the same migration path `docker-compose.staging.yml` already uses for CD, just pointed at Supabase instead of the staging Postgres container. No Dockerfile or compose change was needed.
- Result: all 10 existing migrations applied cleanly (`20261022000000_initial` through `20261028000000_seat_layout`); `prisma migrate status` afterward reports `Database schema is up to date!`.
- Not yet done, and not claimed: seeding demo data, pointing a running `apps/api` instance at this database and smoke-testing a real request end-to-end, and exercising the Free-tier 7-day auto-pause behavior described in the CR.
