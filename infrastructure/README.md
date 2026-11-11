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
