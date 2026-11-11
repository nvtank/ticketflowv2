# Stakeholder register and UAT — DRAFT

Confirmed external stakeholder/contact/consent/sourcing pathway: PENDING_HUMAN. PM nvtank coordinates; no outreach was sent. Instructor named in source is not presumed to have accepted this project.

The "Actual" column below is **automated regression evidence**, not a human
UAT session: each row cites the specific automated test that exercises that
workflow and the real CI run that most recently passed it on `main`. Full
mapping, line numbers and the exact CI run cited:
[`evidence/uat-automated-coverage-2026-11-11.json`](evidence/uat-automated-coverage-2026-11-11.json).
A real stakeholder has not run any of these scenarios by hand; that session,
their feedback, and any accepted/rejected/conditional decision all remain
PENDING_HUMAN below, unchanged by this automated evidence.

| Scenario                              | Expected result                               | Actual / pass/fail / defect / evidence                                          |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| Organizer drafts event and two prices | Persisted for own organization only           | PASS (automated) — `e2e/events.spec.ts:20`                                      |
| Admin approves/rejects                | Only approved event publicly visible          | PASS (automated) — `e2e/events.spec.ts:20` (same test; covers both transitions) |
| Customer competes for seat            | One hold, server deadline and price           | PASS (automated) — `e2e/booking.spec.ts:27`                                     |
| Expired hold/retry order              | No duplicate order or extended TTL            | PASS (automated) — `apps/api/test/booking.integration.test.ts:73,114,198`       |
| Payment verified/forged redirect      | QR only after verified settlement             | PASS (automated) — `e2e/payments.spec.ts:54,81`                                 |
| Customer opens ticket                 | Own valid signed QR only                      | PASS (automated) — `e2e/checkin.spec.ts:39`                                     |
| Staff verifies then confirms twice    | Verify does not consume; one successful entry | PASS (automated) — `apps/api/test/check-in.integration.test.ts:44,78`           |
| Organizer views analytics             | Real scoped sales/attendance match data       | PASS (automated) — `apps/api/test/check-in.integration.test.ts:112`             |

No defect is open against any of the eight scenarios as of this CI run. If a
future run regresses one, record it here with the failing test, the CI run
URL and a link to the fix PR — do not silently drop the row to PENDING.

Why this run was cited rather than re-executed in this change: this
session's sandbox cannot regenerate the Prisma client (`prisma generate`
fails fetching a `linux-nixos` engine binary; nixpkgs only offers a
mismatched major version, 6.18.0, against the installed `@prisma/client`
7.10.1). GitHub Actions runs on Ubuntu and is unaffected — see the evidence
file for the exact error and the real, verifiable run URL.

## Human UAT session (unchanged, PENDING_HUMAN)

Acceptance session date, environment URL/SHA, consenting participant/role, feedback, defects, retest, decision, signature/email evidence: PENDING_HUMAN.

Unsent invitation draft: “We invite you to validate the eight workflows above on an approved test environment. Please confirm your role, consent, available time and acceptance criteria. We will record feedback and request an explicit accepted/rejected/conditional decision after fixes.” No message is sent without explicit authorization. A structured, still-unsent version of this request is at [`UAT_SIGNOFF_REQUEST.md`](UAT_SIGNOFF_REQUEST.md).
