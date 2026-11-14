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

# TF2-046 Vercel Node version pin for `apps/web`

Actual operator and commit author: nvtank. Date: 14 November 2026. Repo-side change only — no Vercel dashboard setting was applied from this environment and no deployment is claimed green.

- `vercel-web-deploy-2026-11-14.json`: the Vercel project `ticketflowv2` fails every build with `ERR_PNPM_UNSUPPORTED_ENGINE (Expected >=24.0.0 <25, Got v26.13.1)`, which is why unrelated pull requests such as the docs-only PR #72 show a failing Vercel status check — Vercel builds every pushed commit, so one misconfigured project reports `FAILURE` on all branches. Root cause: `apps/web/package.json` carried no `engines` field, so with Root Directory set to `apps/web` Vercel picked its default Node 26.x while pnpm enforced the workspace root's `>=24.0.0 <25`.
- Fix recorded: `engines.node` set to `24.x` in `apps/web/package.json` — semver-equivalent to the root's `>=24.0.0 <25`, but written in the form Vercel documents for selecting a Node major, since a range form may be ignored in favour of the project default. Verified locally on Node v24.22.2 — `pnpm -C apps/web build` passed and `prettier --check` on the changed file passed. This makes the required Node major a property of the repo instead of a single dashboard field.
- The pin alone did **not** turn the build green: commit `faf720c` on `chore/TF2-046-vercel-node-engines` still reports `failure`. The build log behind the inspector URL needs Vercel credentials that this environment does not have, so the exact post-fix error line is not claimed. The behaviour is consistent with the project's Root Directory still being the repository root, where Vercel also runs the root `pnpm -r --if-present build` and so tries to build `apps/api` too.
- Still `PENDING_HUMAN`: the dashboard-only fields (Root Directory `apps/web`, Node.js Version 24.x, `API_INTERNAL_URL` env, and keeping `apps/api` out of Vercel Services per [CR-20261112-003](../../qlda/changes/CR-20261112-003-vercel-hosting-split.md)) must be applied by the Vercel project owner. No deployment URL or build log is recorded yet because the build has not actually gone green.
- No Vercel team member was invited: deployments run under the connected GitHub integration so the member list cannot affect build outcome, and inviting members on the Hobby tier would require a paid plan, breaking the zero-cost constraint in issue #67. Reviewers use the preview URL the Vercel bot posts on each pull request.
