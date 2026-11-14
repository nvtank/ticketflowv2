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

# TF2-046 / TF2-049 Vercel `apps/web` build fixes

Actual operator and commit author: nvtank. Date: 14 November 2026. Two repo-side fixes; no Vercel dashboard setting was changed. The preview deployment is green, but merging to `main` — and therefore a public production URL — remains pending human review.

- `vercel-web-deploy-2026-11-14.json`: the Vercel project `ticketflowv2` failed every build, which is why unrelated pull requests such as the docs-only PR #72 showed a failing Vercel status check — Vercel builds every pushed commit, so one broken project reports `FAILURE` on all branches.
- **First defect (TF2-046, issue #67)**: `ERR_PNPM_UNSUPPORTED_ENGINE (Expected >=24.0.0 <25, Got v26.13.1)`. `apps/web/package.json` carried no `engines` field, so Vercel used its project default Node 26.x while pnpm enforced the workspace root's constraint. Fixed by setting `engines.node` to `24.x` — semver-equivalent to the root range, but in the form Vercel documents for selecting a Node major. The build log confirms it took effect: _"the Node.js Version defined in your Project Settings (26.x) will not apply"_.
- **Second defect (TF2-049, issue #74)**: with Node fixed the build reached webpack and failed with `Module not found: Can't resolve '@tixflow/shared'` in five booking components. `@tixflow/shared` resolves through `main: ./dist/index.js`, which only exists after `tsc` runs; CI builds it explicitly before `pnpm build`, but Vercel runs only `apps/web`'s own build script. Fixed with a `prebuild` hook matching the existing `apps/api` convention. Reproduced locally by removing `packages/shared/dist` — the same five errors appeared, and the same clean-state build passed after the fix.
- Result: commit `c9afa4c` on `chore/TF2-046-vercel-node-engines` (PR #73) reports Vercel `success` — the first green deployment this project has had. Both fixes are repo-side, so the required Node major and build order now live in the repository rather than in one dashboard field. The build log also showed Root Directory was already `apps/web`, correcting an earlier guess that it was the repository root.
- **Preview URLs are not public on this project**: `curl` against the preview URL returns `302` to `vercel.com/sso-api` for `/`, `/events` and `/login`, i.e. Vercel Authentication is enabled for preview deployments. This retracts an earlier claim in this file that previews were publicly reachable. Reviewers without Vercel access cannot open the preview; the free remedy is to disable Vercel Authentication for previews, not to buy seats. `https://ticketflowv2.vercel.app` returned `404` because `main` has never built successfully — it should become live once PR #73 merges.
- Still `PENDING_HUMAN`: `API_INTERNAL_URL` is unset, so the deployed site cannot reach a real API. The build passes regardless because `apps/web/next.config.ts` falls back to `http://localhost:4100`. That wiring is TF2-048 (issue #69), not TF2-046. `apps/api` remains off Vercel per [CR-20261112-003](../../qlda/changes/CR-20261112-003-vercel-hosting-split.md).
- No Vercel team member was invited: deployments run under the connected GitHub integration so the member list cannot affect build outcome, and inviting members on the Hobby tier would require a paid plan, breaking the zero-cost constraint in issue #67.
