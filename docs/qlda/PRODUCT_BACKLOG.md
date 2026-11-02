# Product Backlog

All estimates PROPOSED; all original historical windows are audit references. DoR/DoD in CONTRIBUTING.md. Live mappings in evidence/github-sync.json.

| ID      | Deliverable                                                   | DRI             | Reviewer        | WBS | Sprint  | SP  | Priority | Dependencies                                         |
| ------- | ------------------------------------------------------------- | --------------- | --------------- | --- | ------- | --- | -------- | ---------------------------------------------------- |
| TF2-001 | Charter 13 mục + Business Case + SMART goals                  | nvtank          | TuanAn0311      | 1.1 | Kickoff | 3   | P0       | none                                                 |
| TF2-002 | Stakeholder register, sourcing pathway, UAT criteria          | nvtank          | nguyen-van-hoan | 1.2 | Kickoff | 3   | P0       | none                                                 |
| TF2-003 | Scope baseline + WBS 100% + WBS Dictionary                    | nvtank          | TuanAn0311      | 1.3 | Kickoff | 5   | P0       | TF2-001, TF2-006                                     |
| TF2-004 | Risk Register v1, communications/change plan                  | nvtank          | nguyen-van-hoan | 1.4 | Kickoff | 3   | P0       | TF2-001                                              |
| TF2-005 | GitHub Project board, issue/PR templates, labels & milestones | nvtank          | TuanAn0311      | 1.5 | Kickoff | 5   | P0       | TF2-003                                              |
| TF2-006 | Requirements, personas, user journeys, NFR                    | nguyen-van-hoan | nvtank          | 2.1 | Kickoff | 5   | P0       | none                                                 |
| TF2-007 | ADR/C4/ERD, API contracts & DB design                         | TuanAn0311      | nguyen-van-hoan | 2.2 | Kickoff | 5   | P0       | TF2-006                                              |
| TF2-008 | pnpm monorepo, TS strict, lint/format, shared contracts       | TuanAn0311      | nvtank          | 3.1 | S1      | 5   | P0       | TF2-007                                              |
| TF2-009 | Docker local/test DB, Redis, env samples, healthcheck         | nvtank          | TuanAn0311      | 3.2 | S1      | 3   | P0       | TF2-008                                              |
| TF2-010 | CI: lint/typecheck/build/test + branch rules instructions     | nvtank          | TuanAn0311      | 3.3 | S1      | 5   | P0       | TF2-008, TF2-009                                     |
| TF2-011 | Prisma schema/migrations/dev-test seed                        | TuanAn0311      | nguyen-van-hoan | 3.4 | S1      | 5   | P0       | TF2-007, TF2-009                                     |
| TF2-012 | JWT/refresh/session/RBAC/organization policy                  | TuanAn0311      | nvtank          | 3.5 | S1      | 8   | P0       | TF2-011                                              |
| TF2-013 | Next design system + auth/workspace UI                        | nguyen-van-hoan | TuanAn0311      | 3.6 | S1      | 5   | P0       | TF2-008, TF2-012                                     |
| TF2-014 | Event CRUD + lifecycle/review backend                         | TuanAn0311      | nguyen-van-hoan | 4.1 | S1      | 8   | P0       | TF2-011, TF2-012                                     |
| TF2-015 | Organizer/Admin event forms + review screens                  | nguyen-van-hoan | TuanAn0311      | 4.2 | S1      | 5   | P0       | TF2-013, TF2-014                                     |
| TF2-016 | Public events catalog/search/detail + integration             | nguyen-van-hoan | TuanAn0311      | 4.3 | S1      | 5   | P0       | TF2-014, TF2-013                                     |
| TF2-017 | Auth/event unit/integration/E2E + Sprint 1 Retro              | nvtank          | TuanAn0311      | 8.1 | S1      | 5   | P0       | TF2-012, TF2-014, TF2-015, TF2-016                   |
| TF2-018 | Zone/ticket type/seat schema + validation                     | TuanAn0311      | nguyen-van-hoan | 4.4 | S2      | 5   | P0       | TF2-011, TF2-014                                     |
| TF2-019 | Organizer seat grid + pricing UI                              | nguyen-van-hoan | TuanAn0311      | 4.5 | S2      | 5   | P0       | TF2-015, TF2-018                                     |
| TF2-020 | Atomic hold service/row locks/TTL/ownership                   | TuanAn0311      | nguyen-van-hoan | 5.1 | S2      | 8   | P0       | TF2-012, TF2-018                                     |
| TF2-021 | Seat selector, countdown, availability UI                     | nguyen-van-hoan | TuanAn0311      | 5.2 | S2      | 5   | P0       | TF2-016, TF2-020                                     |
| TF2-022 | Idempotent order, server amount, release/expiry               | TuanAn0311      | nvtank          | 5.3 | S2      | 8   | P0       | TF2-020                                              |
| TF2-023 | Concurrent booking/rollback/TTL tests                         | TuanAn0311      | nguyen-van-hoan | 8.2 | S2      | 5   | P0       | TF2-020, TF2-022                                     |
| TF2-024 | Realtime Socket.IO with REST resync (P1)                      | TuanAn0311      | nguyen-van-hoan | 5.4 | S2      | 5   | P1       | TF2-020                                              |
| TF2-025 | Checkout UI + order history                                   | nguyen-van-hoan | TuanAn0311      | 5.5 | S2      | 5   | P0       | TF2-021, TF2-022                                     |
| TF2-026 | Staging, error logs, Sprint 2 review/retro                    | nvtank          | nguyen-van-hoan | 8.3 | S2      | 5   | P0       | TF2-010, TF2-017                                     |
| TF2-027 | Payment provider interface + mock dev/test                    | TuanAn0311      | nvtank          | 6.1 | S3      | 5   | P0       | TF2-022                                              |
| TF2-028 | PayOS integration, signed webhook/idempotency/reconciliation  | TuanAn0311      | nvtank          | 6.2 | S3      | 8   | P0       | TF2-027                                              |
| TF2-029 | Payment screen/status/error/cancel flows                      | nguyen-van-hoan | TuanAn0311      | 6.3 | S3      | 5   | P0       | TF2-025, TF2-027                                     |
| TF2-030 | Signed QR ticket issuance + authorization                     | TuanAn0311      | nguyen-van-hoan | 6.4 | S3      | 5   | P0       | TF2-027, TF2-028                                     |
| TF2-031 | My Tickets + QR frontend                                      | nguyen-van-hoan | TuanAn0311      | 6.5 | S3      | 3   | P0       | TF2-030                                              |
| TF2-032 | Staff assignment + one-time check-in transaction              | TuanAn0311      | nvtank          | 7.1 | S3      | 8   | P0       | TF2-012, TF2-030                                     |
| TF2-033 | Mobile check-in UI/scanner/fallback                           | nguyen-van-hoan | TuanAn0311      | 7.2 | S3      | 5   | P0       | TF2-031, TF2-032                                     |
| TF2-034 | Sales/occupancy/check-in analytics API                        | TuanAn0311      | nguyen-van-hoan | 7.3 | S3      | 5   | P0       | TF2-022, TF2-032                                     |
| TF2-035 | Organizer analytics charts + filters                          | nguyen-van-hoan | TuanAn0311      | 7.4 | S3      | 5   | P0       | TF2-034                                              |
| TF2-036 | Payment/check-in concurrency/E2E, risk evolution, S3 retro    | nvtank          | TuanAn0311      | 8.4 | S3      | 8   | P0       | TF2-028, TF2-030, TF2-032, TF2-035                   |
| TF2-037 | Prod Dockerfiles and immutable builds                         | nvtank          | TuanAn0311      | 8.5 | S4      | 5   | P0       | TF2-008, TF2-009                                     |
| TF2-038 | AWS IaC/IAM OIDC/ECR/SSM/HTTPS runbook                        | nvtank          | TuanAn0311      | 8.6 | S4      | 8   | P0       | TF2-037                                              |
| TF2-039 | CD workflow, healthchecks, safe rollout/rollback              | nvtank          | TuanAn0311      | 8.7 | S4      | 5   | P0       | TF2-010, TF2-037, TF2-038                            |
| TF2-040 | CloudWatch/logging/S3 backup + restore drill                  | nvtank          | TuanAn0311      | 8.8 | S4      | 5   | P0       | TF2-038, TF2-039                                     |
| TF2-041 | Security checks, dependency scan, test matrix, regression     | TuanAn0311      | nvtank          | 8.9 | S4      | 8   | P0       | TF2-017, TF2-023, TF2-036                            |
| TF2-042 | Stakeholder UAT script, feedback & sign-off request           | nvtank          | nguyen-van-hoan | 9.1 | S4      | 5   | P0       | TF2-016, TF2-025, TF2-031, TF2-033, TF2-035, TF2-041 |
| TF2-043 | Actual risk/change record + final sprint retro                | nvtank          | TuanAn0311      | 1.6 | S4      | 3   | P0       | TF2-004, TF2-036                                     |
| TF2-044 | Final Technical Report 7 chapters, evidence index             | nvtank          | TuanAn0311      | 9.2 | S4      | 8   | P0       | TF2-003, TF2-041, TF2-042, TF2-043                   |
| TF2-045 | Slides, live demo script, final release checklist             | nvtank          | TuanAn0311      | 9.3 | S4      | 5   | P0       | TF2-044                                              |
