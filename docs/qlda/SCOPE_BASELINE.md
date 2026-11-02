# Scope baseline v0.1 — DRAFT / PROPOSED

Source: Master Prompt sections 4–7. All 45 mandatory deliverables map once to WBS leaves; test tasks verify product deliverables and do not duplicate their implementation estimates. JSON backlog is the machine-readable dictionary source. Team/PO approval PENDING_HUMAN.

P0: pnpm strict TypeScript Next/Nest/PostgreSQL/Prisma, Docker, env validation; JWT/refresh/revocation/RBAC/tenancy; draft/review/publish/catalog; price/seat inventory; atomic hold/TTL/idempotent server-priced order; dev/test mock and authorized signed provider settlement; owned signed QR; assigned staff one-time check-in; DB analytics; responsive UI; tests/CI; gated HTTPS/cloud/logging/backup/rollback; governance/UAT/evidence.

P1: TF2-024 Socket.IO with REST resync. Excluded: advanced Venue Studio, waiting room, social features, OAuth, coupons, automatic refunds, HA/multi-region and unsupported capacity claims. Real PayOS verification remains conditional on authorized credentials and webhook environment.

Acceptance: DoD, actual independent approval, CI and relevant test results, approved staging smoke tests, real stakeholder UAT. A prepared workflow/IaC is not a deployed system. Do not mark merged code as stakeholder acceptance.

Changes use CHANGE_REQUEST_TEMPLATE.md and an authentic CCB decision; no retroactive baseline approvals. Actual artifact evidence is recorded under evidence/.
