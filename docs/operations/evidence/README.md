# TF2-037 / TF2-026 local technical evidence

Actual operator and commit author: nvtank. Date: 05 November 2026. These are production-mode local containers, not a public release or a human acceptance record.

- `staging-2026-11-05.json`: 24 passing real-container checks, actual timestamps, tested worktree revision, immutable image IDs and the limitations of the earlier build-base labels. All three images built successfully; all ten migrations were applied to the isolated staging DB on first startup and later runs completed without pending migrations.
- `api-log-sample.txt`: actual request-ID/status/duration log samples, including readiness 503 during a deliberate Redis outage and recovery 200; passwords/tokens/runtime secrets were checked against the captured API log and were absent.
- Application checks: 131 unit tests across 12 files passed; workspace lint, typecheck and formatting passed. The added API_HOST test checks safe loopback defaults, explicit container binding and invalid-host rejection. Production Next build compiled and generated 27 static pages; actual HTTPS delivery of standalone browser assets passed.
- The required GitHub quality workflow additionally builds and tests this stack using the checked-out PR commit, then removes containers while retaining volumes. It also retains the existing integration/browser suite. CI status must be read from the actual PR checks; local results do not imply CI already passed.

TF2-037 is technically implemented and locally verified, pending independent approval/required CI/merge. TF2-026 has local readiness/error-log evidence, runbook and Review/Retro preparation; approved **public HTTPS and an actual team Review/Retro remain pending**. No stakeholder signature, payment settlement, AWS provision or DNS change occurred.

Runtime keys, environment file, bearer tokens, passwords and local CA private keys are excluded. The local CA root certificate is not submitted as a public trust certificate. Registry digests are empty for locally built app images; image IDs identify the exact tested local artifacts.

# TF2-039 local rollout/rollback evidence

Actual operator and commit author: nvtank. Date: 11 November 2026. Local `docker-compose.staging.yml` stack only — no AWS, no remote host.

- `cd-rollout-2026-11-11.json`: `scripts/deploy/rollout.py` deployed a known-good release (healthy), then deployed a release with a deliberately broken `DATABASE_URL` override; Docker Compose reported `dependency failed to start: container ticketflowv2-staging-api-1 is unhealthy`, the script detected the failed health gate and automatically redeployed the previous release, which recovered to healthy. Final state and both releases' image IDs/config hash are recorded.
- The real remote deploy job (`deploy-production` in `.github/workflows/cd.yml`) is gated on the `production` GitHub environment and an `AWS_DEPLOY_ROLE_ARN` repository variable that is not set; it is skipped, not faked, until TF2-038's IaC is actually applied and approved. The `migration-restore-gate` job requires an explicit `workflow_dispatch` confirmation plus a separate `production-migration` environment approval, and only then runs the existing isolated-DB restore drill from TF2-040.
