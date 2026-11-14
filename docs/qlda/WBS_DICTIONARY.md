# WBS Dictionary — DRAFT

Estimates PROPOSED, not confirmed by Planning Poker. Inputs are source requirements and accepted dependency outputs. Owner is DRI; actual author tracked separately. Each leaf maps to one deliverable.

## 1.1 — TF2-001

Parent: 1.0. Description/deliverable: Charter 13 mục + Business Case + SMART goals. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: source requirements. Estimate: 3 SP PROPOSED; due: Kickoff continuation forecast (SPRINTS.md). Historical classification: W1.

Acceptance: 13 numbered charter sections identify business case, measurable gates, authority, budget and assumptions; PO and instructor signature fields remain PENDING_HUMAN until evidence exists.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-001); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 1.2 — TF2-002

Parent: 1.0. Description/deliverable: Stakeholder register, sourcing pathway, UAT criteria. Owner: @nvtank; reviewer: @nguyen-van-hoan.

Inputs/dependencies: source requirements. Estimate: 3 SP PROPOSED; due: Kickoff continuation forecast (SPRINTS.md). Historical classification: W1.

Acceptance: Record only confirmed stakeholder identity and consent; otherwise PENDING_HUMAN; Choose sourcing pathway with evidence; define eight observable UAT scenarios.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-002); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 1.3 — TF2-003

Parent: 1.0. Description/deliverable: Scope baseline + WBS 100% + WBS Dictionary. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-001, TF2-006. Estimate: 5 SP PROPOSED; due: Kickoff continuation forecast (SPRINTS.md). Historical classification: W1.

Acceptance: Every baseline deliverable maps to exactly one WBS leaf; all 45 required IDs are present; Dictionary includes owner, inputs, output, dependencies, estimate, timebox and evidence.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-003); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 1.4 — TF2-004

Parent: 1.0. Description/deliverable: Risk Register v1, communications/change plan. Owner: @nvtank; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-001. Estimate: 3 SP PROPOSED; due: Kickoff continuation forecast (SPRINTS.md). Historical classification: W1.

Acceptance: At least 11 risks include P/I/score, trigger, owner, mitigation, contingency and review date; Change approval and meeting decisions never imply unconfirmed human consent.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-004); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 1.5 — TF2-005

Parent: 1.0. Description/deliverable: GitHub Project board, issue/PR templates, labels & milestones. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-003. Estimate: 5 SP PROPOSED; due: Kickoff continuation forecast (SPRINTS.md). Historical classification: W1.

Acceptance: Idempotent sync creates or reuses 45 stable IDs, labels and sprint milestones; Project uses five required statuses, or captures exact permission failure with rerunnable sync.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-005); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 2.1 — TF2-006

Parent: 2.0. Description/deliverable: Requirements, personas, user journeys, NFR. Owner: @nguyen-van-hoan; reviewer: @nvtank.

Inputs/dependencies: source requirements. Estimate: 5 SP PROPOSED; due: Kickoff continuation forecast (SPRINTS.md). Historical classification: W1.

Acceptance: Document customer, organizer, admin and staff journeys with error and empty states; NFRs include tenant isolation, validation, responsive 320/390px and evidence-based performance.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-006); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 2.2 — TF2-007

Parent: 2.0. Description/deliverable: ADR/C4/ERD, API contracts & DB design. Owner: @TuanAn0311; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-006. Estimate: 5 SP PROPOSED; due: Kickoff continuation forecast (SPRINTS.md). Historical classification: W1.

Acceptance: ADR selects modular monolith, lists boundaries and transaction ownership; ERD/API design covers sessions, tenancy, seats, holds, orders, settlement and check-in.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-007); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 3.1 — TF2-008

Parent: 3.0. Description/deliverable: pnpm monorepo, TS strict, lint/format, shared contracts. Owner: @TuanAn0311; reviewer: @nvtank.

Inputs/dependencies: TF2-007. Estimate: 5 SP PROPOSED; due: S1 continuation forecast (SPRINTS.md). Historical classification: W2.

Acceptance: pnpm frozen install, strict typecheck, formatting, lint, unit tests and build succeed; Shared runtime schemas are consumed by API; no reference repository source is copied.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-008); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 3.2 — TF2-009

Parent: 3.0. Description/deliverable: Docker local/test DB, Redis, env samples, healthcheck. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-008. Estimate: 3 SP PROPOSED; due: S1 continuation forecast (SPRINTS.md). Historical classification: W2.

Acceptance: Local/test PostgreSQL and Redis use isolated volumes and loopback-only host ports; Environment validation rejects unsafe production settings; readiness checks dependencies.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-009); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 3.3 — TF2-010

Parent: 3.0. Description/deliverable: CI: lint/typecheck/build/test + branch rules instructions. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-008, TF2-009. Estimate: 5 SP PROPOSED; due: S1 continuation forecast (SPRINTS.md). Historical classification: W2.

Acceptance: PR CI executes lint, format, typecheck, unit, DB integration and build with no skipped failures; Document and enforce independent approval and required checks on main.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-010); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 3.4 — TF2-011

Parent: 3.0. Description/deliverable: Prisma schema/migrations/dev-test seed. Owner: @TuanAn0311; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-007, TF2-009. Estimate: 5 SP PROPOSED; due: S1 continuation forecast (SPRINTS.md). Historical classification: W2.

Acceptance: Prisma schema and initial migration apply to isolated PostgreSQL; seed is explicit dev/test only; Unique constraints and indexes cover membership/session lookup; no secrets or invented records.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-011); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 3.5 — TF2-012

Parent: 3.0. Description/deliverable: JWT/refresh/session/RBAC/organization policy. Owner: @TuanAn0311; reviewer: @nvtank.

Inputs/dependencies: TF2-011. Estimate: 8 SP PROPOSED; due: S1 continuation forecast (SPRINTS.md). Historical classification: W2–3.

Acceptance: Registration always creates CUSTOMER; password is hashed; JWT expiry and session revocation enforced; Refresh rotates atomically; replay revokes session; cross-organization and wrong-role access denied.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-012); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 3.6 — TF2-013

Parent: 3.0. Description/deliverable: Next design system + auth/workspace UI. Owner: @nguyen-van-hoan; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-008, TF2-012. Estimate: 5 SP PROPOSED; due: S1 continuation forecast (SPRINTS.md). Historical classification: W2–3.

Acceptance: Responsive accessible login/register and workspace navigation integrate real API; Expired/loading/error states and role redirects covered by browser tests.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-013); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 4.1 — TF2-014

Parent: 4.0. Description/deliverable: Event CRUD + lifecycle/review backend. Owner: @TuanAn0311; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-011, TF2-012. Estimate: 8 SP PROPOSED; due: S1 continuation forecast (SPRINTS.md). Historical classification: W3.

Acceptance: Only organization member can edit own draft; ADMIN approves/rejects with audit record; Public catalog excludes unapproved events; illegal transitions return conflict.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-014); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 4.2 — TF2-015

Parent: 4.0. Description/deliverable: Organizer/Admin event forms + review screens. Owner: @nguyen-van-hoan; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-013, TF2-014. Estimate: 5 SP PROPOSED; due: S1 continuation forecast (SPRINTS.md). Historical classification: W3.

Acceptance: Organizer creates/edits/submits and ADMIN reviews using API; Validation, rejection, unauthorized and loading states exercised.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-015); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 4.3 — TF2-016

Parent: 4.0. Description/deliverable: Public events catalog/search/detail + integration. Owner: @nguyen-van-hoan; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-014, TF2-013. Estimate: 5 SP PROPOSED; due: S1 continuation forecast (SPRINTS.md). Historical classification: W3.

Acceptance: Catalog search/detail read published data from API with empty/error/loading states; Unpublished and cross-scope data are not leaked; mobile and keyboard use tested.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-016); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.1 — TF2-017

Parent: 8.0. Description/deliverable: Auth/event unit/integration/E2E + Sprint 1 Retro. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-012, TF2-014, TF2-015, TF2-016. Estimate: 5 SP PROPOSED; due: S1 continuation forecast (SPRINTS.md). Historical classification: W3.

Acceptance: Auth and event negative/positive unit, DB integration and E2E reports linked; Sprint 1 retrospective attendance and decisions remain PENDING_HUMAN until meeting.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-017); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 4.4 — TF2-018

Parent: 4.0. Description/deliverable: Zone/ticket type/seat schema + validation. Owner: @TuanAn0311; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-011, TF2-014. Estimate: 5 SP PROPOSED; due: S2 continuation forecast (SPRINTS.md). Historical classification: W4.

Acceptance: Zone/seat/ticket-type constraints reject duplicate labels and negative/non-integer prices; Inventory edits cannot invalidate sold or active held seats.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-018); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 4.5 — TF2-019

Parent: 4.0. Description/deliverable: Organizer seat grid + pricing UI. Owner: @nguyen-van-hoan; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-015, TF2-018. Estimate: 5 SP PROPOSED; due: S2 continuation forecast (SPRINTS.md). Historical classification: W4.

Acceptance: Organizer assigns two price types and persists simple grid through API; Unsafe edits and unauthorized organizer access are rejected.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-019); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 5.1 — TF2-020

Parent: 5.0. Description/deliverable: Atomic hold service/row locks/TTL/ownership. Owner: @TuanAn0311; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-012, TF2-018. Estimate: 8 SP PROPOSED; due: S2 continuation forecast (SPRINTS.md). Historical classification: W4.

Acceptance: Database transaction allows at most one active hold per seat; ownership required; Server TTL, atomic multi-seat rollback, limits and retry behavior verified.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-020); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 5.2 — TF2-021

Parent: 5.0. Description/deliverable: Seat selector, countdown, availability UI. Owner: @nguyen-van-hoan; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-016, TF2-020. Estimate: 5 SP PROPOSED; due: S2 continuation forecast (SPRINTS.md). Historical classification: W4–5.

Acceptance: Seat selector derives deadline from server time and resyncs on conflict; Expiry, inaccessible seats, network failure and mobile selection exercised.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-021); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 5.3 — TF2-022

Parent: 5.0. Description/deliverable: Idempotent order, server amount, release/expiry. Owner: @TuanAn0311; reviewer: @nvtank.

Inputs/dependencies: TF2-020. Estimate: 8 SP PROPOSED; due: S2 continuation forecast (SPRINTS.md). Historical classification: W5.

Acceptance: Idempotency key scoped to customer; retries reuse order; amounts from server; Order does not extend hold; expiry releases inventory atomically.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-022); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.2 — TF2-023

Parent: 8.0. Description/deliverable: Concurrent booking/rollback/TTL tests. Owner: @TuanAn0311; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-020, TF2-022. Estimate: 5 SP PROPOSED; due: S2 continuation forecast (SPRINTS.md). Historical classification: W5.

Acceptance: 2/20/100 concurrent same-seat attempts yield at most one winning hold; TTL reclaim, all-or-nothing rollback and idempotency are verified on real PostgreSQL.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-023); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 5.4 — TF2-024

Parent: 5.0. Description/deliverable: Realtime Socket.IO with REST resync (P1). Owner: @TuanAn0311; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-020. Estimate: 5 SP PROPOSED; due: S2 continuation forecast (SPRINTS.md). Historical classification: W5.

Acceptance: P1: authorized rooms emit only after transaction commits; Reconnect performs authoritative REST resync; no P0 dependency on socket.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-024); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 5.5 — TF2-025

Parent: 5.0. Description/deliverable: Checkout UI + order history. Owner: @nguyen-van-hoan; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-021, TF2-022. Estimate: 5 SP PROPOSED; due: S2 continuation forecast (SPRINTS.md). Historical classification: W5.

Acceptance: Checkout shows server total and retry-safe submit; order history is customer-scoped; Pending/expired/cancelled/failed states are visible and tested.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-025); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.3 — TF2-026

Parent: 8.0. Description/deliverable: Staging, error logs, Sprint 2 review/retro. Owner: @nvtank; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-010, TF2-017. Estimate: 5 SP PROPOSED; due: S2 continuation forecast (SPRINTS.md). Historical classification: W5.

Acceptance: Approved HTTPS staging has readiness/error log evidence or remains BLOCKED; Sprint 2 review/retro are human meeting records with dates and attendees.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-026); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 6.1 — TF2-027

Parent: 6.0. Description/deliverable: Payment provider interface + mock dev/test. Owner: @TuanAn0311; reviewer: @nvtank.

Inputs/dependencies: TF2-022. Estimate: 5 SP PROPOSED; due: S3 continuation forecast (SPRINTS.md). Historical classification: W6.

Acceptance: Provider contract separates initiation from verified settlement; Mock is rejected outside dev/test and cannot be enabled by client input.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-027); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 6.2 — TF2-028

Parent: 6.0. Description/deliverable: PayOS integration, signed webhook/idempotency/reconciliation. Owner: @TuanAn0311; reviewer: @nvtank.

Inputs/dependencies: TF2-027. Estimate: 8 SP PROPOSED; due: S3 continuation forecast (SPRINTS.md). Historical classification: W6.

Acceptance: Verify webhook signature, merchant/order/amount/currency and unique provider reference; Duplicate and late webhook, reconciliation and forged redirect do not over-issue; real transaction PENDING approval.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-028); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 6.3 — TF2-029

Parent: 6.0. Description/deliverable: Payment screen/status/error/cancel flows. Owner: @nguyen-van-hoan; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-025, TF2-027. Estimate: 5 SP PROPOSED; due: S3 continuation forecast (SPRINTS.md). Historical classification: W6.

Acceptance: Payment UI queries server status and never confirms payment via redirect alone; Cancel, expired, failed, loading and retry states integrate API.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-029); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 6.4 — TF2-030

Parent: 6.0. Description/deliverable: Signed QR ticket issuance + authorization. Owner: @TuanAn0311; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-027, TF2-028. Estimate: 5 SP PROPOSED; due: S3 continuation forecast (SPRINTS.md). Historical classification: W6.

Acceptance: Signed ticket is issued once only after verified settlement and customer ownership; Tampering and foreign-owner access are rejected; signing keys do not appear in logs.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-030); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 6.5 — TF2-031

Parent: 6.0. Description/deliverable: My Tickets + QR frontend. Owner: @nguyen-van-hoan; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-030. Estimate: 3 SP PROPOSED; due: S3 continuation forecast (SPRINTS.md). Historical classification: W6.

Acceptance: My Tickets shows only owned issued tickets and real QR data; Empty/expired/error states and mobile QR presentation covered.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-031); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 7.1 — TF2-032

Parent: 7.0. Description/deliverable: Staff assignment + one-time check-in transaction. Owner: @TuanAn0311; reviewer: @nvtank.

Inputs/dependencies: TF2-012, TF2-030. Estimate: 8 SP PROPOSED; due: S3 continuation forecast (SPRINTS.md). Historical classification: W7.

Acceptance: Assigned staff only can verify/confirm event ticket; verify does not consume; Concurrent confirms produce exactly one USED transition with audit record.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-032); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 7.2 — TF2-033

Parent: 7.0. Description/deliverable: Mobile check-in UI/scanner/fallback. Owner: @nguyen-van-hoan; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-031, TF2-032. Estimate: 5 SP PROPOSED; due: S3 continuation forecast (SPRINTS.md). Historical classification: W7.

Acceptance: Mobile scanner requests camera only on action and offers manual fallback; Invalid/already-used/unauthorized/offline states do not imply successful admission.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-033); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 7.3 — TF2-034

Parent: 7.0. Description/deliverable: Sales/occupancy/check-in analytics API. Owner: @TuanAn0311; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-022, TF2-032. Estimate: 5 SP PROPOSED; due: S3 continuation forecast (SPRINTS.md). Historical classification: W7.

Acceptance: Tenant-scoped aggregates count settled orders/revenue and distinct check-ins; Filters and zero-data cases verified against fixtures; no hardcoded KPIs.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-034); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 7.4 — TF2-035

Parent: 7.0. Description/deliverable: Organizer analytics charts + filters. Owner: @nguyen-van-hoan; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-034. Estimate: 5 SP PROPOSED; due: S3 continuation forecast (SPRINTS.md). Historical classification: W7.

Acceptance: Charts consume real analytics API and expose date filters and empty states; Accessible labels and mobile tables verified.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-035); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.4 — TF2-036

Parent: 8.0. Description/deliverable: Payment/check-in concurrency/E2E, risk evolution, S3 retro. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-028, TF2-030, TF2-032, TF2-035. Estimate: 8 SP PROPOSED; due: S3 continuation forecast (SPRINTS.md). Historical classification: W7.

Acceptance: Payment and check-in races plus full-flow E2E linked to actual test logs; Risk evolution and Sprint 3 retro distinguish actual observations from pending meetings.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-036); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.5 — TF2-037

Parent: 8.0. Description/deliverable: Prod Dockerfiles and immutable builds. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-008, TF2-009. Estimate: 5 SP PROPOSED; due: S4 continuation forecast (SPRINTS.md). Historical classification: W8.

Acceptance: Production images use lockfile, non-root process and healthchecks; Secrets excluded from image context; image identity immutable in release manifest.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-037); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.6 — TF2-038

Parent: 8.0. Description/deliverable: AWS IaC/IAM OIDC/ECR/SSM/HTTPS runbook. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-037. Estimate: 8 SP PROPOSED; due: S4 continuation forecast (SPRINTS.md). Historical classification: W8.

Acceptance: IaC defines least-privilege OIDC/ECR/SSM, TLS prerequisites and private data services; Validation/runbook prepared; paid apply and DNS changes remain approval gated.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-038); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.7 — TF2-039

Parent: 8.0. Description/deliverable: CD workflow, healthchecks, safe rollout/rollback. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-010, TF2-037, TF2-038. Estimate: 5 SP PROPOSED; due: S4 continuation forecast (SPRINTS.md). Historical classification: W8.

Acceptance: Deploy requires protected environment approval and exact image digest; Health failure rolls back previous known image; migration restore has explicit human gate.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-039); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.8 — TF2-040

Parent: 8.0. Description/deliverable: CloudWatch/logging/S3 backup + restore drill. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-038, TF2-039. Estimate: 5 SP PROPOSED; due: S4 continuation forecast (SPRINTS.md). Historical classification: W8.

Acceptance: Logs exclude tokens/PII and monitoring uses measured signals; Encrypted backup restore drill records actual evidence; unexecuted drill remains PENDING.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-040); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.9 — TF2-041

Parent: 8.0. Description/deliverable: Security checks, dependency scan, test matrix, regression. Owner: @TuanAn0311; reviewer: @nvtank.

Inputs/dependencies: TF2-017, TF2-023, TF2-036. Estimate: 8 SP PROPOSED; due: S4 continuation forecast (SPRINTS.md). Historical classification: W8–9.

Acceptance: Dependency/security scans, tenant permission matrix and regression reports linked; Critical business tests and 320/390/desktop checks pass before release.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-041); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.10 — TF2-046

Parent: 8.0. Description/deliverable: Vercel Node.js version config and apps/web-only deploy. Owner: @nguyen-van-hoan; reviewer: @nvtank.

Inputs/dependencies: TF2-037, CR-20261112-003. Estimate: 3 SP PROPOSED; due: S4 Cloud & Acceptance (SPRINTS.md). Historical classification: W9.

Acceptance: Vercel project targets `apps/web` with Node 24.x engine setting matching `package.json`; build succeeds without `ERR_PNPM_UNSUPPORTED_ENGINE`; `apps/api` remains excluded from Vercel services.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-046); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.11 — TF2-047

Parent: 8.0. Description/deliverable: CR hosting-split decision record + runbook update. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: CR-20261112-003. Estimate: 3 SP PROPOSED; due: S4 Cloud & Acceptance (SPRINTS.md). Historical classification: W9.

Acceptance: Independent architecture review recorded in CR-20261112-003; `infrastructure/README.md` and operations runbooks document hosting split and `API_INTERNAL_URL` wiring; no contradiction between CR, SCOPE_BASELINE.md, and WBS.md.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-047); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 8.12 — TF2-048

Parent: 8.0. Description/deliverable: Verify apps/web↔API wiring on Vercel (env/CORS/build). Owner: @nguyen-van-hoan; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-046, TF2-047. Estimate: 3 SP PROPOSED; due: S4 Cloud & Acceptance (SPRINTS.md). Historical classification: W9.

Acceptance: Vercel environment variable `API_INTERNAL_URL` verified against backend targets; Next.js same-origin API rewrite and CORS policy validated; blocked/gated external API state recorded in evidence.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-048); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 9.1 — TF2-042

Parent: 9.0. Description/deliverable: Stakeholder UAT script, feedback & sign-off request. Owner: @nvtank; reviewer: @nguyen-van-hoan.

Inputs/dependencies: TF2-016, TF2-025, TF2-031, TF2-033, TF2-035, TF2-041. Estimate: 5 SP PROPOSED; due: S4 continuation forecast (SPRINTS.md). Historical classification: W9.

Acceptance: Eight UAT scenarios have actual/pass/fail/defect/evidence fields; Stakeholder acceptance remains PENDING_HUMAN without authentic signed/email evidence.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-042); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 1.6 — TF2-043

Parent: 1.0. Description/deliverable: Actual risk/change record + final sprint retro. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-004, TF2-036. Estimate: 3 SP PROPOSED; due: S4 continuation forecast (SPRINTS.md). Historical classification: W9.

Acceptance: Record actual management blocker with timestamps and resolution evidence; CCB approval, baseline revision and final retrospective remain pending until real decisions.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-043); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 9.2 — TF2-044

Parent: 9.0. Description/deliverable: Final Technical Report 7 chapters, evidence index. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-003, TF2-041, TF2-042, TF2-043. Estimate: 8 SP PROPOSED; due: S4 continuation forecast (SPRINTS.md). Historical classification: W9.

Acceptance: Seven report chapters reference actual Issues/PR/CI/test evidence; no invented velocity; Final PDF 15–25 pages reviewed; evidence index covers all eight required artifacts.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-044); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.

## 9.3 — TF2-045

Parent: 9.0. Description/deliverable: Slides, live demo script, final release checklist. Owner: @nvtank; reviewer: @TuanAn0311.

Inputs/dependencies: TF2-044. Estimate: 5 SP PROPOSED; due: S4 continuation forecast (SPRINTS.md). Historical classification: W9.

Acceptance: 8–10 slides, six-minute presentation, five-minute demo and five-minute Q&A script; Release checklist verifies human approval, HTTPS, backup, UAT, Drive sharing and fallback.

Issue link: resolve stable ID in [live backlog](https://github.com/nvtank/ticketflowv2/issues?q=TF2-045); actual URL is captured in evidence/github-sync.json. Evidence/PR: PENDING.
