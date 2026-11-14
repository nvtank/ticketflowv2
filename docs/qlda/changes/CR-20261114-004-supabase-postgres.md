# CR-20261114-004 — database target: Supabase-hosted PostgreSQL for `apps/api`

Observed 2026-11-14. Source: actual user instruction in this session ("giờ tao
dổi lưu database trên supabase nha?") while working through TF2-046/TF2-049
(making the Vercel `apps/web` deployment pass) and TF2-048 (wiring `apps/web`
on Vercel to a reachable API).

Prior baseline: `SCOPE_BASELINE.md` names PostgreSQL as the database engine
but does not name a hosting provider; the only hosting target planned for the
database was self-managed PostgreSQL via Docker (local/staging) with AWS as
the eventual production target (TF2-038's IaC: VPC, ECR, SSM, no RDS/compute
yet — see TF2-038 evidence, `VALIDATED_NO_APPLY`). `CR-20261112-003` split
`apps/web` onto Vercel but explicitly kept `apps/api` and its data store on
the Docker/AWS path.

Decision: use a Supabase-hosted PostgreSQL instance as `apps/api`'s database,
in place of (for now) a self-hosted Postgres container, for development/
staging/demo use. `apps/api` itself is unaffected architecturally — it keeps
running as a persistent Docker/AWS process per `CR-20261112-003`; only the
value of `DATABASE_URL` changes to point at the Supabase instance instead of
the local `postgres:16-alpine` container.

Rationale / compatibility, confirmed by reading the actual schema and code,
not assumed:

- `apps/api/prisma/schema.prisma:9` declares `provider = "postgresql"`; all
  11 existing migrations under `apps/api/prisma/migrations/` are plain
  PostgreSQL SQL. Supabase is PostgreSQL, so no schema or migration rewrite
  is required — this is a connection-string change, not a data-layer
  migration.
- `apps/api/src/database/database.service.ts` and `apps/api/src/seed.ts`
  construct `PrismaClient` via `@prisma/adapter-pg` (`PrismaPg`) over a plain
  `pg` connection pool (`max: 10` / `max: 2`). `apps/api` is a long-running
  NestJS process (`app.listen()` in `apps/api/src/main.ts`), not a serverless
  function, so Supabase's **direct connection** (or IPv4 **Session pooler** if
  the network lacks IPv6) is the correct mode — not the Transaction pooler,
  which is tuned for serverless/edge callers and disables prepared
  statements.
- Zero schema changes needed anywhere else: `apps/web` has no database
  access at all (confirmed: no Prisma/DB references under `apps/web/src`);
  it only ever talks to `apps/api` over HTTP, so this change is invisible to
  the frontend and to the Vercel hosting split.

Alternatives considered:

- MongoDB: rejected. Would require replacing the PostgreSQL `datasource` in
  `schema.prisma`, rewriting all 11 existing relational migrations as a
  document schema, and auditing every Prisma relational query (joins,
  transactions such as the seat-hold flow) for document-store equivalents.
  This is a data-layer rewrite, not a hosting change, and nothing in the
  current scope calls for it.
- Keep self-hosted Postgres only (Docker/AWS, no managed provider): viable
  but was rejected for the immediate need because it ties database
  availability to whichever machine runs `docker-compose.staging.yml`, which
  is also the blocker already recorded for TF2-048 (API reachability). AWS
  RDS was not chosen either because TF2-038's Terraform has no RDS resource
  yet (`VALIDATED_NO_APPLY`, compute/database both absent) — standing one up
  is new infrastructure work and a recurring AWS cost, not a same-day fix.

Scope impact: adds Supabase as a database hosting target for `apps/api`,
alongside (not replacing) the Docker/AWS compute target already decided in
`CR-20261112-003`. Does not change `apps/web`'s Vercel hosting. New work item
TF2-050, placed on **Sprint 2 (active)** per the existing preference recorded
in `CR-20261112-003`'s correction (see `docs/qlda/WBS.md` 8.14).

Cost impact: $0 — Supabase Free tier. Known limitation, confirmed against
Supabase's own published 2026 pricing: a Free-tier project auto-pauses after
7 days with no database traffic (resumable from the dashboard for up to a
year), is capped at 2 active projects and 500 MB storage, and carries no
backups/SLA. Acceptable for development/staging/demo use; not a production
guarantee. If this becomes the production target, upgrading to Supabase Pro
(paid) or revisiting AWS RDS needs separate authorization — this CR covers
the Free tier only.

Security: the Supabase connection string contains a database password. It is
set directly into the operator's local `.env` (gitignored) and the
equivalent deployment secret store; it is never committed, logged, or pasted
into chat/evidence.

Implementation authorization: actual user instruction in this session.
Formal course CCB/PO/instructor acceptance: PENDING_HUMAN. This record
documents a real technical decision and its reasoning; it is not presented as
a signed, approved course CR.
