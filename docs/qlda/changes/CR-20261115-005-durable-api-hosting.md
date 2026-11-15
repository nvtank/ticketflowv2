# CR-20261115-005 — durable hosting target for `apps/api`

Observed 2026-11-15. Source: actual user request for TF2-057 (Issue #83) following
the deployment of `apps/web` on Vercel (TF2-046/TF2-049) and database migration
to Supabase PostgreSQL (CR-20261114-004 / TF2-050).

## 1. Problem Statement & Baseline Context

The TixFlow V2 system currently operates in a split-hosting topology per
[CR-20261112-003](CR-20261112-003-vercel-hosting-split.md):

- **Frontend (`apps/web`)**: Runs durably on Vercel with automated CI/CD, global
  edge caching, and a stable public HTTPS URL (`https://ticketflowv2.vercel.app`).
- **Database**: Runs durably on Supabase PostgreSQL (`aws-0-ap-southeast-1.pooler.supabase.com`)
  with all 11 relational schema migrations applied.
- **Backend (`apps/api`)**: **Lacks a durable public host.**

Currently, the only mechanism enabling `apps/web` on Vercel to communicate with
`apps/api` is a temporary Cloudflare Quick Tunnel ([QUICK_TUNNEL.md](../../operations/QUICK_TUNNEL.md)).
This approach presents severe operational blockers:

1. **Dynamic URL Rotation on Restart**: Every restart generates a random, ephemeral
   subdomain (e.g., `https://*.trycloudflare.com`). Consequently, `apps/web`'s
   `API_INTERNAL_URL` environment variable must be manually updated in Vercel,
   followed by a full site rebuild/redeploy on every test session.
2. **Single-Workstation Dependency**: Availability strictly depends on an individual
   engineer's local development machine remaining awake, powered on, and online.
3. **Explicit Non-Durable Status**: Recorded in TF2-026/TF2-048 evidence as
   temporary verification only, preventing the permanent resolution of Issue #69 (TF2-048).

### Status of the AWS Infrastructure Path

The AWS deployment path (`infrastructure/aws/`) is **not ready** for immediate use:

- Statically validated via Terraform (`VALIDATED_NO_APPLY`, commit `5498556`).
- Provisions **only foundational components**: ECR repositories (`api`, `web`, `gateway`),
  VPC with 2 public / 2 private subnets, security groups, IAM OIDC deploy role,
  KMS key, and SSM parameter placeholders.
- **Missing critical compute and routing resources**:
  - No ECS Cluster, Task Definition, or ECS Service.
  - No Application Load Balancer (ALB), Target Group, or HTTPS Listener.
  - No managed ElastiCache Redis cluster.
  - No DNS validation for the ACM certificate (requires an owned domain).
- Standing up these resources requires writing substantial new Terraform IaC and
  incurs unavoidable recurring cloud expenditure.

---

## 2. Architectural Constraints from Source Code

A valid hosting target for `apps/api` cannot be selected based on convenience or
generic PaaS marketing. It must satisfy **hard technical constraints** verified
directly in the implementation:

1. **Persistent Server Process (Non-Serverless)**:
   - `apps/api/src/main.ts:12` explicitly invokes `await app.listen(environment.API_PORT, environment.API_HOST)`.
   - The application is a long-running NestJS Modular Monolith daemon, not a request-driven
     stateless function handler (AWS Lambda, Vercel Serverless, Google Cloud Run min-instances=0).

2. **In-Process Seat-Hold TTL & Reconciliation**:
   - `apps/api/src/booking/hold-lifecycle.service.ts:29-34` registers an unreferenced
     `setInterval` timer (`HOLD_RECONCILE_INTERVAL_MS = 10_000` / 10s) upon module initialization.
   - Every interval, `reconcile()` queries PostgreSQL with `pg_advisory_xact_lock`
     to release seat holds that exceed the 300-second TTL (`expiresAt <= now`),
     reverting seat status from `HELD` to `AVAILABLE`.
   - If hosted on a platform that suspends CPU or freezes processes when idle (e.g.,
     Render Free Tier sleeping after 15 minutes of inactivity), the timer halts.
     Expired holds remain locked in the database indefinitely until a subsequent HTTP
     request awakens the container.

3. **Stateful WebSocket Gateway (Socket.IO)**:
   - `apps/api/src/realtime/realtime.gateway.ts:48-50` exposes a WebSocket server
     (`transports: ['websocket']`) for realtime seat status broadcasts (`SEAT_HELD`,
     `SEAT_RELEASED`, `SEAT_SOLD`).
   - Requires persistent TCP connections. Ephemeral serverless architectures
     terminate incoming WebSocket connections upon invocation timeout.

4. **Redis Connection & Pub/Sub Dependency**:
   - `apps/api/src/config/environment.ts:56` strictly validates `REDIS_URL` with
     `/^rediss?:\/\//`.
   - `apps/api/src/realtime/realtime-redis.adapter.ts:20-26` initializes two distinct
     `ioredis` clients (publisher and subscriber) connecting to `REDIS_URL` to mount
     `@socket.io/redis-adapter`.
   - Redis is also leveraged for Waiting Room token issuance and queue lease tracking.
   - Any hosting target must provide network reachability to an active Redis instance.

---

## 3. Evaluation of Candidate Hosting Options

| Criterion                    | Option A: Complete AWS Path (ECS Fargate + ALB + ElastiCache)              | Option B: Managed Container PaaS (Render / Railway / Koyeb) + Upstash                                | Option C: Durable Cloudflare Named Tunnel (Tunnel Token + Stable Host)       |
| :--------------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| **Compute Architecture**     | ECS Fargate Task (0.25 vCPU, 0.5 GB RAM) running continuous container.     | Managed Docker container service running `apps/api` production image.                                | Local Docker Compose staging container (`apps/api:staging`) on host machine. |
| **Persistent Timer Support** | **Full**: 100% continuous CPU execution; `setInterval` runs uninterrupted. | **Conditional**: Supported on paid tiers ($5–$7/mo). Free tiers (e.g., Render) sleep after 15m idle. | **Full**: Runs continuously as long as host machine/daemon is active.        |
| **WebSocket / Socket.IO**    | **Full**: ALB supports WebSocket upgrades and persistent TCP tunnels.      | **Full / Good**: Supported on Railway/Render Web Services with HTTP/1.1 WebSocket upgrade.           | **Full**: Cloudflare Tunnel natively proxies WebSocket connections with TLS. |
| **Redis Provisioning**       | AWS ElastiCache for Redis (`cache.t4g.micro`) or ECS container.            | Upstash Serverless Redis (free tier: 10,000 cmds/day) or Railway Redis.                              | Local `redis:7.4-alpine` container inside Compose network.                   |
| **URL Stability**            | Stable HTTPS endpoint via ALB DNS / custom domain.                         | Stable HTTPS URL (`*.onrender.com`, `*.up.railway.app`).                                             | **Stable HTTPS URL** via registered Cloudflare domain / named tunnel route.  |
| **Infrastructure Effort**    | High: ~350 lines of new Terraform (`alb.tf`, `ecs.tf`, `elasticache.tf`).  | Low: Configured via Web UI or `railway.json` / `render.yaml`.                                        | Minimal: 1 Cloudflare tunnel credentials file + configuration runbook.       |
| **Financial Cost**           | **~$45 – $65 / month** (ALB: $18, Fargate: $12, ElastiCache: $17).         | **~$5 – $10 / month** (Free tier sleeps; persistent requires paid tier).                             | **$0.00 / month** (Free Cloudflare Zero Trust tier).                         |
| **Who Pays?**                | Unassigned / No project budget authorized.                                 | Unassigned / Requires personal credit card authorization.                                            | **Nobody ($0 cost)**.                                                        |

---

## 4. Technical Decision: Dual-Track Pragmatic Hosting Strategy

To resolve the immediate blocking issue (#69 / TF2-048) while strictly respecting
the $0 budget constraint, the team adopts a **Dual-Track Hosting Strategy**:

### Track 1 (Immediate Operational Solution): Durable Cloudflare Named Tunnel

- **Target**: Deploy a **Durable Cloudflare Named Tunnel** (`cloudflared tunnel run --token <SECRET>`)
  pointing to the containerized `apps/api` (`http://localhost:4100` or Docker staging network).
- **Domain Binding**: Route through a stable, permanent public hostname (e.g., `api.tixflow.net`
  or a team-managed DNS zone).
- **Environment Stability**: Once provisioned, Vercel's `API_INTERNAL_URL` is set **once** to
  this stable URL. Rebuilds and environment variable churn on every tunnel restart are eliminated.
- **Runtime Integrity**:
  - `HoldLifecycleService` in-process `setInterval` runs uninterrupted.
  - WebSocket connections from `apps/web` proxy cleanly via Cloudflare Tunnel edge.
  - Local Redis 7.4 container handles Socket.IO adapter pub/sub with zero external limits.
  - Supabase PostgreSQL remains the persistent cloud database.
- **Cost**: **$0.00**.

### Track 2 (Autonomous Cloud Production Target): AWS ECS Fargate + ALB

- **Target**: The formal production architecture remains AWS ECS Fargate + ALB + ElastiCache.
- **Status**: **GATED / `PENDING_HUMAN`**.
- This path is documented in `docs/operations/AWS_RUNBOOK.md` and requires:
  1. Allocation of an authorized billing method / AWS credit sponsorship ($45–$65/mo).
  2. DNS delegation for ACM certificate validation.
  3. Execution of `terraform apply` after independent peer review.
- It will NOT be deployed under simulation or presented as completed without authentic
  payment authorization.

---

## 5. Cost Breakdown & Budget Governance ("Who Pays?")

1. **Current Budget Constraint**:
   The TixFlow V2 project has operated at strictly **$0.00** across all modules:
   - Next.js web application: Vercel Hobby Tier ($0).
   - PostgreSQL Database: Supabase Free Tier ($0).
   - Source Control & CI: GitHub Actions Free Tier ($0).
   - DNS & Staging: Cloudflare Free Tier ($0).

2. **Cost of the Chosen Solution (Track 1)**:
   - Cloudflare Named Tunnel: **$0.00 / month** (included in Cloudflare Zero Trust free tier).
   - Host Compute: Existing developer hardware / dedicated workstation ($0 additional expenditure).
   - **Payer**: None ($0).

3. **Cost of Cloud Alternative (Track 2 / AWS)**:
   - AWS Application Load Balancer (ALB): ~$18.00/mo (730 hrs × $0.0225 + LCU usage).
   - AWS ECS Fargate (0.25 vCPU, 0.5 GB RAM continuous): ~$12.50/mo.
   - AWS ElastiCache Redis (`cache.t4g.micro`): ~$17.50/mo.
   - Data Transfer Out / CloudWatch Logs: ~$3.00/mo.
   - **Total**: **~$51.00 / month**.
   - **Payer**: Unassigned. Flagged as **`PENDING_HUMAN`**. Neither the engineering
     DRI nor the PM is authorized to bind personal credit cards or incur billable AWS charges.

---

## 6. What This Decision Does NOT Solve

To maintain absolute academic and technical honesty, this decision explicitly acknowledges
its boundaries:

1. **Host Workstation Uptime**:
   Track 1 (Named Tunnel) provides a **stable URL**, but does **not** provide autonomous
   24/7 cloud uptime. If the developer shuts down the workstation or disconnects from the
   Internet, incoming requests to `apps/web`'s reverse proxy will receive HTTP 502/504
   (Bad Gateway).
2. **Autonomous Cloud Multi-Tenancy**:
   It does not eliminate the eventual necessity of AWS ECS Fargate if 24/7 unattended SLA
   or enterprise high-availability is demanded by course stakeholders.
3. **Formal Course Sign-off**:
   This decision reflects an internal technical and engineering consensus. Formal course
   CCB/PO/instructor acceptance of the split topology remains **`PENDING_HUMAN`**.
4. **Third-Party Rate Limits**:
   Supabase Free Tier will still auto-pause after 7 days of total inactivity (resumable
   via dashboard), which is mitigated during active development and demo phases.

---

## 7. RACI & Independent Review (TF2-057)

- **DRI / Author**: `@TuanAn0311` (Architecture & Backend DRI)
- **Independent Reviewer**: `@nvtank` (PM / CloudOps DRI)
- **Review Date**: 2026-11-15
- **Review Determination**: **APPROVED (Technical Architecture Review)**
- **Formal Course Sign-off**: `PENDING_HUMAN`

### Architecture Concurrence by `@nvtank`:

> "Concur with the dual-track hosting analysis. The dynamic URL rotation of Quick Tunnel
> blocked reproducible testing for Issue #69. Transitioning to a Durable Cloudflare Named Tunnel
> fixes the Vercel `API_INTERNAL_URL` wiring permanently at $0 cost while strictly honoring the
> persistent process and Redis requirements of the NestJS backend. Gating the $51/mo AWS path
> behind explicit human billing authorization preserves the project's zero-cost integrity."
