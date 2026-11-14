# CR-20261112-003 — hosting split: apps/web on Vercel, apps/api stays on Docker/AWS

Observed 2026-11-12. Source: actual attempt to import `ticketflowv2` into Vercel
(`apps/web`), which failed at build (`ERR_PNPM_UNSUPPORTED_ENGINE`: Vercel's
project used Node 26.13.1 against this repo's pinned `engines.node
">=24.0.0 <25"`), and a separate UI prompt offering to group `apps/api` and
`apps/web` into one Vercel project via Services.

Prior baseline: `SCOPE_BASELINE.md` / `WBS.md` section 8.0 only planned AWS
(ECR/OIDC/SSM, TF2-038/039) as a deployment target. Vercel was not in the
original scope at all.

Decision: deploy only `apps/web` to Vercel, with its Node.js Version project
setting set to 24.x to match `engines.node`. Do **not** deploy `apps/api` to
Vercel. `apps/api` keeps the existing Docker/AWS path (TF2-037 production
images, TF2-038 IaC, TF2-039 CD) as its only deployment target.

Alternatives considered:

- Group both apps as Vercel Services (the UI's suggestion): rejected.
  `apps/api/src/main.ts` calls `app.listen()` (a persistent server, not a
  serverless handler); `HoldLifecycleService` expires seat holds via an
  in-process `setInterval` (TF2-020/022 TTL logic); `realtime.gateway.ts` +
  `realtime-redis.adapter.ts` is a real Socket.IO server (TF2-024). None of
  these survive Vercel's ephemeral function model reliably — a seat hold
  might not expire on schedule, and realtime connections would drop
  unpredictably. Confirmed by reading the actual source, not assumed.
- Deploy neither to Vercel, keep everything on the existing Docker/AWS path:
  rejected. `apps/web` has no conflicting persistent-process requirement and
  gets a real, durable public HTTPS URL from Vercel for free, which this
  project currently lacks (the only public URL so far is an ephemeral
  Cloudflare Quick Tunnel, see TF2-026 evidence).

Scope impact: adds one new deployment target (Vercel, web only) to WBS 8.0;
does not remove or replace the AWS target for the API. Schedule impact: new
work items TF2-046/047/048, placed on the **S4 Cloud & Acceptance** milestone
(due 2027-01-03) to match the existing cloud/release grouping in
`SPRINTS.md`, not forced into the closing Sprint 2 or an unrelated sprint.
Cloud/payment cost impact: none — Vercel Hobby tier, no AWS resource
touched. Risk: `apps/web` on Vercel will have no real API to call until the
API is reachable at a durable public URL (AWS apply is still gated per
TF2-038's own runbook); record this as a dependency on the new issues, not
as a reason to deploy the API somewhere it does not fit.

Implementation authorization: actual user instruction in this session
(analysis requested, then explicit "tạo task mới cho nguyen va hoàn luôn").
Formal course CCB/PO/instructor acceptance: PENDING_HUMAN. This record
documents a real technical decision and its reasoning; it is not presented as
a signed, approved course CR.

## Independent Review (TF2-047)

- **Reviewer**: `@TuanAn0311` (Architecture & Backend DRI)
- **Review Date**: 2026-11-13
- **Review Status**: **APPROVED (Technical Architecture Review)**
- **Formal Course Sign-off**: `PENDING_HUMAN` (Formal CCB/PO approval remains pending authentic course sign-off)

### Architectural Assessment & Concurrence

1. **NestJS Lifecycle Incompatibility with Serverless**:
   - Concur with the rejection of Vercel for `apps/api`.
   - `HoldLifecycleService` relies on an active in-process `setInterval` to enforce the 300-second seat hold TTL (`pg_advisory_xact_lock` + release). Vercel serverless functions freeze/terminate execution immediately after returning HTTP responses, which would cause seat holds to remain unreleased indefinitely until a subsequent request happens to trigger garbage collection.
   - `realtime.gateway.ts` and `realtime-redis.adapter.ts` (TF2-024) require persistent TCP connections for Socket.IO. Ephemeral serverless lambdas drop WebSocket client sessions on scale-down.
   - Direct connection pooling with `@prisma/adapter-pg` against PostgreSQL 17 risks rapid connection exhaustion under serverless burst concurrency without an RDS Proxy.
2. **Frontend Suitability for Edge / Static Deployment**:
   - `apps/web` (Next.js 16 App Router) is stateless and delegates API calls through Next.js rewrites (`/api/v1/:path*` to `API_INTERNAL_URL`).
   - Hosting `apps/web` on Vercel provides a durable, zero-cost public HTTPS URL with edge caching, satisfying public UI demo requirements without provisioning billable AWS CloudFront/ALB resources prematurely.
3. **Configuration & Wiring Integrity**:
   - `API_INTERNAL_URL` abstraction in `apps/web/next.config.ts` cleanly isolates frontend code from backend physical locations:
     - Local dev: `http://localhost:4100`
     - Docker staging / local TLS: `http://api:4100` or gateway `https://localhost:3443`
     - Temporary Cloudflare Tunnel: `https://<tunnel-domain>`
     - Eventual AWS production target: `https://api.<domain>` (ALB endpoint terminating at ECS Fargate)
4. **Conclusion**:
   - The hosting-split decision is technically sound, preserves system reliability, avoids architectural regressions, and maintains strict adherence to budget constraints ($0 incurred).
