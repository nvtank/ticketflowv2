# TF2-036 — Payment/check-in concurrency, E2E, risk and retro evidence

**Status:** Test evidence for this task is pending its PR CI run. Sprint 3 retrospective status: **PENDING_HUMAN**.

## Scope and schedule context

This record supports WBS 8.4. The issue's original S3 label was a forecast. Its current delivery assignment places this work in Sprint 2 and says it supersedes the earlier forecast for delivery. No S3 execution or retro meeting is inferred here.

## Existing test contracts found during source review

These are assertions already present in the repository, not results from a new TF2-036 run:

- apps/api/test/payments.integration.test.ts: 20 concurrent signed duplicate callbacks must all be accepted while producing one webhook event, one payment-success audit and exactly one ticket per order item. A separate case races payment settlement against cancellation and checks for one valid terminal state.
- apps/api/test/payments.integration.test.ts: 8 concurrent retries for one mock payment must return one stable payment ID without extending the order expiry.
- apps/api/test/check-in.integration.test.ts: 20- and 100-request concurrent confirmations must produce exactly one 201, all remaining responses 409, one check-in record, one audit and an attendance total of one.
- e2e/payments.spec.ts: customer checkout covers verified mock settlement/owned QR and failed-payment behavior.

## TF2-036 browser race scenario

The check-in browser journey now opens two independent staff sessions for the same ticket, verifies it in both, and submits both confirmations concurrently. The expected API outcomes are one 201 and one 409; the UI should show one successful admission and one already-used result, while the organizer total rises by one. The repository's regression runner runs this suite on desktop Chromium and mobile Chromium.

These outcomes remain expectations until the CI run completes. No pass is claimed in this document yet.

## Risk baseline and evolution

The 2026-11-02 risk register lists double booking (R02) and payment verification (R03) at proposed P/I scores of 3/5. Those are planning baselines, not measured incident rates. Existing race-test assertions show the invariants the team intends to protect; they do not by themselves prove the current run passed or justify lowering either score.

**Current TF2-036 observation:** pending CI execution and review. Record the actual run URL, observed request counts/results, failures and follow-up actions here after the run. Keep proposed scores unchanged until the PM/team reviews actual evidence.

## Test report publication

The required CI / quality workflow uploads import-browser-evidence, including browser HTML reports, JSON results and test output for desktop/mobile suite runs. The workflow currently retains artifacts for 7 days. Link the specific successful workflow run and its artifact from the issue's Evidence URL after CI finishes; do not treat this pending reference as a test log.

## Sprint 3 retrospective

**Status: PENDING_HUMAN.** No retrospective date, attendees, feedback, decisions or actions are recorded because no actual meeting evidence has been provided. The PM coordinates the real retrospective. When held, record its actual date/time, confirmed attendees, discussion, decisions and owners; keep automated test findings clearly labelled as technical evidence rather than member feedback.
