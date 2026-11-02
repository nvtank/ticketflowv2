# Project Charter — DRAFT v0.1, 2026-11-02

## 1. Identification and authority

TixFlow V2, repository nvtank/ticketflowv2. PM: nvtank. Instructor: TS. Nguyễn Thanh Tuấn (from supplied course guidelines). Charter is not signed or approved.

## 2. Sourcing pathway

PROPOSED Pathway 3: an actual VKU event organizer. Organization/contact/consent: PENDING_HUMAN. Pathway 1 only if genuine parallel coursework is confirmed.

## 3. Business case

Small event organizers need consistent inventory, verified settlement, tickets and admission records. Customer demand and quantified benefit have not been validated. MVP will replace fragmented registration and check-in with a traceable transaction workflow.

## 4. SMART goals and success gates

PROPOSED forecast by 2027-01-03: four roles complete organizer draft → admin approval → atomic seat hold → server-priced order → verified test settlement → signed QR → one-time check-in → true analytics. Verify using isolated PostgreSQL integration tests and browser E2E; race tests use 2/20/100 attempts, at most one winner. These are test scenarios, not a throughput promise. HTTPS release requires approved infrastructure and stakeholder acceptance.

## 5. Scope and exclusions

Scope baseline and WBS define P0. Socket realtime is P1. Exclude advanced venue editor, social/OAuth/waiting room, automated refunds and HA. No paid AWS or live payment without explicit approval.

## 6. Deliverables and acceptance

Runnable Next/Nest/PostgreSQL system; tests, CI, Docker, approved HTTPS demo, backup/rollback evidence and eight QLDA artifacts. Acceptance uses Quality Plan and UAT checklist. Pending human acceptance cannot be inferred from tests.

## 7. Methodology and tools

Hybrid Scrum delivery with continuous Kanban flow in GitHub Issues/Projects/PR/Actions; kickoff and four two-week Sprints. Weekly checkpoints and actual meeting records. GitHub is the shared project system.

## 8. Schedule and dependencies

Forecast 2026-11-02–2027-01-03; historic W1–W9 remain audit only. Critical dependency: foundation → auth/event/inventory → booking/order → verified payment/QR → check-in/analytics → regression/UAT. Schedule approval and capacity PENDING_HUMAN.

## 9. Budget and resources

Approved spend: none evidenced. No paid provisioning authorized. Cloud region, cost ceiling, domain, merchant ownership, member hours and budget source PENDING_HUMAN. Local tools are available; cost estimation occurs before any cloud approval request.

## 10. Team and responsibilities

nvtank PM/Scrum/CloudOps; TuanAn0311 Tech Lead/Backend; nguyen-van-hoan Frontend/Full-stack. All participate in QA; nvtank aggregates evidence. Assignments are proposed; actual author is authenticated actor. Contribution percentages are not yet measured.

## 11. Risks, assumptions and constraints

Risk Register covers backend bottleneck, race/settlement safety, cloud budget, availability, stakeholder, provenance and historical evidence gap. No assumption that old code is licensed or that simulated dates prove activity. Fifteen-week requirement cannot be satisfied by compression.

## 12. Communication and change authority

PM coordinates 45m planning, three 10–15m standups weekly, 30m review/retro. CCB proposed: PM + Tech Lead + relevant stakeholder. Actual approvals required for scope/budget/production. Changes record alternatives, impacts, decision evidence and baseline revision.

## 13. Authorization and signatures

Product owner name/signature/date: PENDING_HUMAN. Instructor signature/date: PENDING_HUMAN. Team role/capacity and baseline acceptance: PENDING_HUMAN. Do not export this as a signed artifact.
