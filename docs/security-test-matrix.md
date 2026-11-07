# Security & Regression Test Matrix (TF2-041)

Reconciled and observed on branch `feature/TF2-041-security-test-matrix` on 2026-11-07 by `@TuanAn0311` (reviewer: `@nguyen-van-hoan` / `@nvtank`).

This matrix links automated dependency scans, RBAC and multi-tenant authorization policies, critical business regression test suites, and cross-device responsive viewports.

---

## 1. Dependency & Security Scan

### Audit Findings & Triage

- **Command executed:** `pnpm audit --audit-level=high`
- **Exit code:** `0`
- **Result:** **0 High, 0 Critical vulnerabilities.**
- **Triage record:** 4 non-critical findings (1 low, 3 moderate) in build-time / auxiliary tooling:
  - `body-parser` and `multer`: Overridden to safe releases `body-parser: 2.4.0` and `multer: 2.5.0` via `package.json` pnpm overrides.
  - No untriaged high/critical security advisory affects runtime.

### Secret & Credential Hygiene

- **Zero hardcoded credentials:** Access JWT secret, refresh token hashes, `TICKET_SIGNING_KEY`, PayOS channel credentials, and Google OAuth client secrets are strictly loaded via `apps/api/src/config/environment.ts`.
- **Sanitized Logging:** `HttpExceptionFilter` strips all authorization headers, cookies, tokens, and raw stack traces before outputting to stdout. Ticket signing keys and private session IDs never appear in logs.
- **Client Boundary:** Sensitive environment variables are absent from `NEXT_PUBLIC_*`.

---

## 2. RBAC & Multi-Tenant Authorization Matrix

Guards enforce **default-deny**. Every authenticated request validates session state against PostgreSQL.

| Endpoint Scope                          | Public | CUSTOMER | ORGANIZER |     STAFF     | ADMIN | Security & Tenancy Invariants                                           |
| :-------------------------------------- | :----: | :------: | :-------: | :-----------: | :---: | :---------------------------------------------------------------------- |
| `POST /auth/register`                   |   ✅   |    ❌    |    ❌     |      ❌       |  ❌   | Self-registration forced to `CUSTOMER` role only.                       |
| `POST /auth/login`, `refresh`, `logout` |   ✅   |    ✅    |    ✅     |      ✅       |  ✅   | Rotating HttpOnly cookie; replay revokes session.                       |
| `GET /auth/me`, `PATCH /users/me`       |   ❌   |    ✅    |    ✅     |      ✅       |  ✅   | Own profile only; DTO whitelist rejects injected fields.                |
| `GET /events` (Public catalog)          |   ✅   |    ✅    |    ✅     |      ✅       |  ✅   | Shows only `PUBLISHED` events from `APPROVED` orgs.                     |
| `POST /organizer/events`                |   ❌   |    ❌    |    ✅     |      ❌       |  ❌   | Requires active membership in approved Organization.                    |
| `PATCH /organizer/events/:id`           |   ❌   |    ❌    | ✅ (own)  |      ❌       |  ❌   | **Tenant Isolation:** Foreign organizer denied (403). Locked on review. |
| `PATCH /admin/events/:id/approve`       |   ❌   |    ❌    |    ❌     |      ❌       |  ✅   | Admin only; transitions `PENDING_APPROVAL` → `PUBLISHED`.               |
| `POST /events/:id/holds`                |   ❌   |    ✅    |    ❌     |      ❌       |  ❌   | Customer only; 1 active hold/event, max 4 seats, 300s TTL.              |
| `POST /orders`                          |   ❌   | ✅ (own) |    ❌     |      ❌       |  ❌   | Server computes total amount; client prices ignored.                    |
| `POST /payments/create`                 |   ❌   | ✅ (own) |    ❌     |      ❌       |  ❌   | Order owner only; binds stable `providerOrderCode`.                     |
| `POST /payments/webhook`                |   ✅   |    ✅    |    ✅     |      ✅       |  ✅   | Public endpoint but strictly verified via HMAC SHA-256 signature.       |
| `GET /tickets/me`, `/:id`               |   ❌   | ✅ (own) |    ❌     |      ❌       |  ❌   | Customer owner only; signed QR token generated on-the-fly.              |
| `POST /check-in/verify`, `confirm`      |   ❌   |    ❌    |    ❌     | ✅ (assigned) |  ❌   | Staff must have active `EventStaffAssignment`; atomic `VALID` → `USED`. |
| `GET /admin/dashboard`, `monitoring`    |   ❌   |    ❌    |    ❌     |      ❌       |  ✅   | Admin role check required; metrics disabled in prod.                    |

---

## 3. Core Business Regression Matrix

All critical concurrency and business rules are verified with automated unit and integration tests against real PostgreSQL 17 and Redis 7.4.

| Business Domain                | Invariant / Failure Mode Tested                                                                                               | Automated Test Suite                                            |      Status      |
| :----------------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- | :--------------: |
| **Authentication & Session**   | Token expiration (900s), cookie rotation, refresh replay session revocation, concurrent tab Web Locks protection              | `auth-policy.test.ts`<br/>`auth.integration.test.ts`            | **PASS (14/14)** |
| **Event Lifecycle**            | Draft CRUD, submission validation, admin approval/rejection audit, immutability of published events                           | `events-policy.test.ts`<br/>`events.integration.test.ts`        | **PASS (13/13)** |
| **Seat Hold Concurrency**      | 2/20/100 concurrent attempts on same seats; sorted seat UUID lock order prevents deadlocks; group rollback                    | `booking-policy.test.ts`<br/>`booking.integration.test.ts`      | **PASS (12/12)** |
| **Payment Settlement**         | Webhook HMAC SHA-256 verification; `pg_advisory_xact_lock` duplicate callback serialization; `WebhookEvent` idempotency       | `payments-policy.test.ts`<br/>`payments.integration.test.ts`    | **PASS (37/37)** |
| **Late / Mismatched Payment**  | Webhook after 300s hold expiry routes to `REFUND_REQUIRED`; extra bank transfer logged for review without over-issuing        | `payments.integration.test.ts`                                  |     **PASS**     |
| **Ticket Issuance & Check-in** | QR token signed with HMAC `TICKET_SIGNING_KEY`; assigned staff verification; atomic one-time consumption (409 on second scan) | `qr-decoder.test.ts`<br/>`check-in.integration.test.ts`         | **PASS (10/10)** |
| **Waiting Room**               | Redis Lua bounded FIFO lease; server clock validation; admission rate limiting                                                | `waiting-policy.test.ts`<br/>`waiting-room.integration.test.ts` |  **PASS (8/8)**  |

---

## 4. Cross-Device Responsive Matrix

Front-end responsive layouts and customer booking flows are verified via Playwright across 3 standard viewports:

| Device Viewport      | Dimensions    | Configuration                                       | Verification Scope                                                                                      |  Status  |
| :------------------- | :------------ | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :------: |
| **Small Mobile**     | 320 x 740 px  | `playwright.responsive.config.ts` (`Pixel 7` 320px) | Viewport horizontal scroll suppression, sticky mobile checkout bar, seat map pinch/pan fallback         | **PASS** |
| **Standard Mobile**  | 390 x 844 px  | `playwright.config.ts` (Mobile Chromium / WebKit)   | Navbar drawer, bottom sheet ticket modal, QR ticket presentation, mobile camera check-in                | **PASS** |
| **Desktop / Laptop** | 1280 x 720 px | `playwright.config.ts` (Desktop Chromium)           | Full seat grid selection, organizer analytics charts, admin review table, real-time Socket.IO inventory | **PASS** |

Runner command: `node scripts/run-browser-regression.mjs`

---

## 5. Summary & Residual Risk

- **Critical business regression:** 100% automated test coverage across holding, payment race conditions, and one-time ticket check-in.
- **Residual items pending production gate:**
  - Real bank payment settlement remains pending authorized corporate bank account (automated tests verified with mock/fixtures).
  - Public DNS and TLS deployment pending authorized cloud infrastructure gate.
