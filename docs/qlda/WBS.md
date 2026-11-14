# WBS — 100% baseline coverage

Each of the 45 issue deliverables occurs at one leaf. Prefix groups aggregate leaves and are not separate estimates.

## 1.0 Governance

- 1.1 TF2-001: Charter 13 mục + Business Case + SMART goals
- 1.2 TF2-002: Stakeholder register, sourcing pathway, UAT criteria
- 1.3 TF2-003: Scope baseline + WBS 100% + WBS Dictionary
- 1.4 TF2-004: Risk Register v1, communications/change plan
- 1.5 TF2-005: GitHub Project board, issue/PR templates, labels & milestones
- 1.6 TF2-043: Actual risk/change record + final sprint retro

## 2.0 Requirements & Architecture

- 2.1 TF2-006: Requirements, personas, user journeys, NFR
- 2.2 TF2-007: ADR/C4/ERD, API contracts & DB design

## 3.0 Foundation & Identity

- 3.1 TF2-008: pnpm monorepo, TS strict, lint/format, shared contracts
- 3.2 TF2-009: Docker local/test DB, Redis, env samples, healthcheck
- 3.3 TF2-010: CI: lint/typecheck/build/test + branch rules instructions
- 3.4 TF2-011: Prisma schema/migrations/dev-test seed
- 3.5 TF2-012: JWT/refresh/session/RBAC/organization policy
- 3.6 TF2-013: Next design system + auth/workspace UI

## 4.0 Event & Seat Inventory

- 4.1 TF2-014: Event CRUD + lifecycle/review backend
- 4.2 TF2-015: Organizer/Admin event forms + review screens
- 4.3 TF2-016: Public events catalog/search/detail + integration
- 4.4 TF2-018: Zone/ticket type/seat schema + validation
- 4.5 TF2-019: Organizer seat grid + pricing UI

## 5.0 Booking & Orders

- 5.1 TF2-020: Atomic hold service/row locks/TTL/ownership
- 5.2 TF2-021: Seat selector, countdown, availability UI
- 5.3 TF2-022: Idempotent order, server amount, release/expiry
- 5.4 TF2-024: Realtime Socket.IO with REST resync (P1)
- 5.5 TF2-025: Checkout UI + order history

## 6.0 Payment & QR Tickets

- 6.1 TF2-027: Payment provider interface + mock dev/test
- 6.2 TF2-028: PayOS integration, signed webhook/idempotency/reconciliation
- 6.3 TF2-029: Payment screen/status/error/cancel flows
- 6.4 TF2-030: Signed QR ticket issuance + authorization
- 6.5 TF2-031: My Tickets + QR frontend

## 7.0 Check-in & Analytics

- 7.1 TF2-032: Staff assignment + one-time check-in transaction
- 7.2 TF2-033: Mobile check-in UI/scanner/fallback
- 7.3 TF2-034: Sales/occupancy/check-in analytics API
- 7.4 TF2-035: Organizer analytics charts + filters

## 8.0 QA / Cloud / Release

- 8.1 TF2-017: Auth/event unit/integration/E2E + Sprint 1 Retro
- 8.2 TF2-023: Concurrent booking/rollback/TTL tests
- 8.3 TF2-026: Staging, error logs, Sprint 2 review/retro
- 8.4 TF2-036: Payment/check-in concurrency/E2E, risk evolution, S3 retro
- 8.5 TF2-037: Prod Dockerfiles and immutable builds
- 8.6 TF2-038: AWS IaC/IAM OIDC/ECR/SSM/HTTPS runbook
- 8.7 TF2-039: CD workflow, healthchecks, safe rollout/rollback
- 8.8 TF2-040: CloudWatch/logging/S3 backup + restore drill
- 8.9 TF2-041: Security checks, dependency scan, test matrix, regression
- 8.10 TF2-046: Vercel Node.js version config and apps/web-only deploy
- 8.11 TF2-047: CR hosting-split decision record + runbook update
- 8.12 TF2-048: Verify apps/web↔API wiring on Vercel (env/CORS/build)
- 8.13 TF2-049: Build @tixflow/shared before the Vercel apps/web build

## 9.0 UAT & Closure

- 9.1 TF2-042: Stakeholder UAT script, feedback & sign-off request
- 9.2 TF2-044: Final Technical Report 7 chapters, evidence index
- 9.3 TF2-045: Slides, live demo script, final release checklist
