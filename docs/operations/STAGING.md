# Production containers and isolated staging

Owner: nvtank. Technical delivery: TF2-037 and TF2-026. Source work is submitted through a PR; an eligible teammate must approve and strict quality CI must pass before merging.

## Start and verify

Requires Docker Engine/Compose, Python 3 and Git. From the repository root:

```sh
python3 scripts/setup-staging.py
python3 scripts/check-staging.py --build
```

The setup script refuses to overwrite existing keys. The ignored `.local/staging/runtime.env` is mode 0600. Keep the JWT and ticket keys across restarts; do not regenerate them against an existing database. Never paste this file or expanded `docker compose config` output into an Issue.

The production images use Node 24 (digest pinned), pnpm 10.34.1, frozen lockfile installation, multi-stage builds and non-root web/API processes. The API artifact has production dependencies; the Prisma CLI remains in a separate migration target. Next standalone tracing includes the monorepo and public/static assets. `.dockerignore` excludes credentials, Git metadata, local outputs, input packs and docs. No secret is an image build argument.

Compose project `ticketflowv2-staging` has its own PostgreSQL database `tixflow_staging` and named volumes. DB, Redis, API and web publish no host ports. Only the gateway binds **127.0.0.1:3443**. Existing development and test stacks are unaffected. Payments are disabled, not mock production settlement. No seeded administrator or demo accounts are created automatically; smoke registration creates a unique isolated CUSTOMER record.

Open `https://localhost:3443`. Caddy issues a certificate from an isolated local CA. The checker copies the CA certificate and verifies both chain and hostname using it; it does not disable TLS verification. A browser will warn until this local CA is trusted. The CA is ephemeral and changes when the gateway is recreated. This is **local TLS verification, not approved public HTTPS deployment**.

The checker verifies dependency readiness, production Swagger removal, request-ID error correlation, production authentication/secure cookies, non-root execution, read-only filesystems, no internal host port exposure and no runtime secrets baked into image environment. It stops only this stack's Redis, observes readiness 503 while liveness remains 200, restarts Redis and checks readiness recovery and sanitized API logs. `finally` restarts Redis even on a failed outage test. `--down` stops this Compose project after testing without deleting volumes.

## Evidence and image identity

`.local/staging/results.json` records actual timestamps, checks, Git revision/dirty state and immutable local image IDs. `.local/staging/api.log` contains request IDs/status/duration, not request bodies, query strings, tokens or secrets. The JSON-file driver rotates logs at 10 MB × 3 per service. Full cloud log aggregation is TF2-040 and is not claimed here.

When `image_label_identifies_build_base` is true, the OCI revision label identifies the original build base, not an exact clean source snapshot. Consult `tested_worktree_revision` and `working_tree_dirty` and the actual image IDs. Fresh CI builds generate their environment from the checked-out commit; local development evidence must not be presented as a registry-published release.

`release.override.yml` pins the tested web/API image IDs; it is generated only after a successful smoke test. For an exact local replay, append this override to the same Compose command:

```sh
docker compose --env-file .local/staging/runtime.env \
  -f infrastructure/docker-compose.staging.yml \
  -f .local/staging/release.override.yml up -d --no-build api web gateway
```

Keep the original images available. A registry deployment must record published repo digests instead of treating a mutable tag as immutable. The current images are local and have not been pushed to a registry. Migration changes are forward-only: reverting the app image does not revert schema; review schema compatibility and backup/restore before a real release.

```sh
docker compose --env-file .local/staging/runtime.env \
  -f infrastructure/docker-compose.staging.yml ps
docker compose --env-file .local/staging/runtime.env \
  -f infrastructure/docker-compose.staging.yml logs --tail=100 api
docker compose --env-file .local/staging/runtime.env \
  -f infrastructure/docker-compose.staging.yml down
```

Do not add `-v`; it would delete staging data.

## Public staging gate

The user approved a free temporary Quick Tunnel on 05 November 2026; see [Quick Tunnel operations](QUICK_TUNNEL.md) for its observed URL, verification and stop command. Durable hosting/domain remains unprovisioned. No DNS/production change, billable resource or live payment is authorized by this task. Before a durable public deployment: approve hosting/cost and domain; configure gateway certificates and API allowed/return origins together; keep API/DB/Redis private; provision protected runtime secrets; verify TLS from an external client; run full workflow/UAT; attach actual URL, logs and release identity. Socket.IO uses the browser's same origin through `/socket.io/`; the web image's internal HTTP rewrite targets Compose service `api:4100`.

## Sprint 2 review and retrospective

Use `docs/qlda/SPRINT_2_REVIEW_RETRO_PENDING.md` to prepare the meeting. Actual date, attendees, decisions, feedback and approvals remain pending until the team meets. Automated tests and a prepared agenda are not a meeting record or stakeholder sign-off.
