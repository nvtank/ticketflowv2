# TF2-017 — observed auth/event quality evidence

Actual operator and commit author: nvtank. These tests were rerun on 05 November 2026; they are not evidence of execution during the earlier baseline September window.

`auth-events-2026-11-05.json` records **28 unit, 37 PostgreSQL/Redis integration and 8 desktop/mobile browser tests**. Every selected assertion passed. It includes case names, actual source report timestamps and SHA-256 hashes. The collector rejects missing required suites and failed, skipped or flaky browser runs. Collection Git revision is metadata and is not misrepresented as the revision of every original test execution.

| Requirement                    | Positive and negative evidence                                                                                         | Source                                |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Credentials and account policy | Salted password hashes, email normalization, wrong password and role injection rejection                               | auth-policy + auth.integration        |
| Session security               | Refresh rotation/replay, parallel refresh, expiry, logout, lock and password revocation                                | auth.integration                      |
| Role and tenant authorization  | Four-role checks, organization membership and cross-organization denials                                               | auth-policy + auth/events.integration |
| Event lifecycle                | Private drafts, complete inventory before submit, edit freeze, admin rejection reason and conflicting decisions        | events-policy + events.integration    |
| Inventory/catalog              | Unique seats/prices, invalid replacement rollback, approved-only catalog, privacy and sold-seat protections            | events.integration                    |
| Actual browser journeys        | Register/profile/session/role checks; organizer → rejection/correction → approval → public catalog; desktop and mobile | e2e/auth.spec.ts + e2e/events.spec.ts |

## Reproduce

Use Node 24 and pnpm 10.34.1. Start the isolated test Compose stack, apply migrations with `pnpm test:db:prepare`, and build the shared/API/web packages before browser execution. Ports are 55443/56393 for test data and 4100/3100 for the test app; refuse to reuse unrelated servers.

```sh
pnpm exec vitest run apps/api/test/auth-policy.test.ts apps/api/test/events-policy.test.ts \
  --reporter=default --reporter=json --outputFile=.local/test-reports/unit.json
pnpm --filter @tixflow/api test:integration auth.integration.test.ts events.integration.test.ts \
  --reporter=default --reporter=json --outputFile="$PWD/.local/test-reports/integration.json"
PLAYWRIGHT_JSON_OUTPUT_DIR=.local/browser-json \
  node scripts/run-browser-regression.mjs auth events
python3 scripts/sprint_evidence.py
python3 scripts/test_sprint_evidence.py
```

Vitest file filtering can also match google-auth.integration.test.ts. The collector counts only the two required named files, not unrelated cases. CI produces the same auth/event extract from its full unit/integration/browser runs and uploads the raw reports and the summary as artifacts. Payments in automated tests use isolated mock fixtures, never real settlement.

## Remaining human gate

Sprint 1 retrospective attendance, observations and decisions remain PENDING_HUMAN. See `docs/qlda/SPRINT_1_REVIEW_RETRO_PENDING.md`. Passing tests, Git author metadata and a PR approval alone do not establish that a Sprint meeting occurred. TF2-017 remains open while its human deliverable is outstanding; these technical artifacts are submitted for independent review.

Reporter configuration follows [Vitest reporters](https://vitest.dev/guide/reporters) and [Playwright reporters](https://playwright.dev/docs/test-reporters).
