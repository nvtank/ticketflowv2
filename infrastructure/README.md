# Local infrastructure for the imported V2 application

Imported from `nvtank/ticketflow-aws` at `91833bcc`. V2 uses a distinct Compose project and host ports to avoid the earlier prototype and other local applications.

From the repository root:

```sh
cp .env.example .env
# Set a local password consistently in POSTGRES_PASSWORD and DATABASE_URL.
docker compose --env-file .env -f infrastructure/docker-compose.yml config --quiet
docker compose --env-file .env -f infrastructure/docker-compose.yml up -d --wait
docker compose --env-file .env -f infrastructure/docker-compose.yml ps
```

Compose interpolation uses the root `.env` when invoked from the root. `--env-file .env`
is explicit in the pnpm scripts to avoid ambiguity. Data persists in named volumes;
`pnpm infra:down` does not delete it. Services bind to loopback only. Redis is a
local-only instance, not a production authentication configuration. No AWS resource is used.

Development services bind to loopback ports 55444 (PostgreSQL) and 56394 (Redis).
The test stack uses project `ticketflowv2-import-test`, database `tixflow_test`, and
loopback ports 55443/56393. Test PostgreSQL storage is ephemeral. Run
`pnpm test:infra:up`, `pnpm test:db:prepare`, then `pnpm test:integration`.

The imported schema/migrations replace the prototype's history. Run them only
against the new isolated database, not the earlier prototype database. A clean
test database successfully applied all ten source migrations during import validation.

The original source contained local Compose infrastructure only. Production
Dockerfiles and the isolated local-TLS staging stack are added in TF2-037/026;
see [staging operations](../docs/operations/STAGING.md) for commands, actual checks
and pending public deployment gates. Public HTTPS and backup/restore
are separate deliverables. AWS IaC (TF2-038) lives in [`aws/`](aws/README.md);
it is statically validated only. No AWS deployment is claimed.

## Hosting Split Decision (Vercel + Docker/AWS)

Per [CR-20261112-003](../docs/qlda/changes/CR-20261112-003-vercel-hosting-split.md), the deployment architecture is split across two targets:

| Component      | Target Platform  | Justification & Architecture                                                                                                                                                                                                                                                                                                                         |
| :------------- | :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`apps/web`** | **Vercel**       | Next.js 16 App Router (Node 24.x project setting). Stateless SSR/SSG/ISR with zero-cost global edge CDN, automatic TLS, and durable public HTTPS.                                                                                                                                                                                                    |
| **`apps/api`** | **Docker / AWS** | NestJS 11 Modular Monolith on ECS Fargate / Docker Compose staging (TF2-037/038/039). Requires a **persistent daemon process** for in-process seat hold expiry intervals (`HoldLifecycleService`), Socket.IO WebSocket gateway (`realtime.gateway.ts`), and PostgreSQL/Redis connection pool management. Cannot run on ephemeral serverless lambdas. |

### `apps/web` API Base URL Wiring (`API_INTERNAL_URL`)

The frontend never exposes backend addresses directly to the client browser. Instead, browser calls go to the same-origin relative path `/api/v1/:path*`, and Next.js rewrites these requests server-side via `apps/web/next.config.ts`:

```typescript
const apiUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4100';
// rewrites: [{ source: '/api/v1/:path*', destination: `${parsedApiUrl.origin}/api/v1/:path*` }]
```

Depending on the environment, configure `API_INTERNAL_URL` as follows:

| Environment                  | `API_INTERNAL_URL` Target                      | Description                                                                                                    |
| :--------------------------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Local Development**        | `http://localhost:4100` _(default)_            | Direct loopback connection to local NestJS process.                                                            |
| **Docker Staging**           | `http://api:4100` or `https://localhost:3443`  | Internal Docker Compose network DNS or local staging gateway.                                                  |
| **Temporary Staging Tunnel** | `https://<tunnel-subdomain>.trycloudflare.com` | Public Cloudflare Quick Tunnel (TF2-026) for testing Vercel previews against local staging API.                |
| **Eventual AWS Target**      | `https://api.<domain>`                         | Production AWS Application Load Balancer (ALB) terminating TLS and routing to ECS Fargate tasks (TF2-038/039). |
