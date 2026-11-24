# Database Backup, Encryption & Restore Drill (TF2-040)

Reconciled and executed on branch `feature/TF2-040-cloudwatch-logging-s3-backup-restore-drill` on 2026-11-07 by `@TuanAn0311` (DRI: `@nvtank`, reviewer: `@TuanAn0311`).

This operational guide and evidence record documents CloudWatch logging, metrics signals, AES-256 encrypted database backup procedures, and the verification drill report.

---

## 1. CloudWatch & Sanitized Logging Architecture

### Zero-PII Log Sanitization Policy

- **Request Context:** Every incoming HTTP request is assigned a unique `requestId` (`X-Request-ID`).
- **Sanitized Exception Handling:** Configured in `apps/api/src/common/http/api-exception.filter.ts`:
  - 500 errors log strictly `{ requestId, statusCode }` without raw stack traces, DB credentials, or parameters.
  - JWT tokens, HttpOnly cookies, user passwords, and customer phone/email are never written to stdout.
- **Ticket Signing Key Isolation:** `TICKET_SIGNING_KEY` is kept in process memory only. Ticket verification logs only the public opaque ticket code (`TF-...`), never the raw HMAC secret or decrypted QR credential payload.

### CloudWatch Measured Metrics Signals

- In production, metrics remain private. In local/staging, the `/metrics` endpoint (`apps/api/src/monitoring/monitoring.controller.ts`) exposes measured signals:
  - Total completed HTTP requests, error counters, and status codes.
  - Booking outcomes (hold acquisitions, releases, expired counts).
  - Active real-time Socket.IO connected clients.
  - `validHeldSeats`: Queried live from PostgreSQL (`Seat` join `SeatHold` where `expiresAt > clock_timestamp()`), returning `null` on database outage (never fabricating zero).

---

## 2. Encrypted Backup Strategy (S3 Target)

To protect customer transactional data without incurring unauthorized cloud costs, backup automation uses AES-256 client-side encryption before archival.

- **Dump Mechanism:** `pg_dump --clean --if-exists` exporting all schema definitions, constraints, migrations, and transactional tables.
- **Encryption Algorithm:** **AES-256-GCM** (Galois/Counter Mode):
  - Key length: 256 bits (32 bytes).
  - Initialization Vector (IV): 96 bits (12 bytes) uniquely generated per backup.
  - Authentication Tag: 128 bits (16 bytes) verifying ciphertext integrity and authenticity.
- **S3 Archival Path Specification:**
  `s3://tixflow-encrypted-backups/drills/{YYYY-MM-DD}/tixflow_drill.sql.enc`
- **Integrity Validation:** SHA-256 checksum digest calculated over the plaintext dump stream before encryption and compared byte-for-byte upon restoration.

---

## 3. Restore Drill Execution Report

The automated restore drill was executed against the isolated PostgreSQL 17 test stack via `scripts/backup-restore-drill.mjs`.

### Drill Parameters & Execution Log

| Step | Action                          | Detail / Metric                                           |         Status          |
| :--- | :------------------------------ | :-------------------------------------------------------- | :---------------------: |
| 1    | **Source Export**               | Dumped source database `tixflow_test`                     | **PASS** (66,598 bytes) |
| 2    | **Source Checksum**             | SHA-256 calculated: `cc9d78ff...`                         |        **PASS**         |
| 3    | **AES-256-GCM Encryption**      | Encrypted with 32-byte key, 12-byte IV, 16-byte Auth Tag  | **PASS** (66,626 bytes) |
| 4    | **Simulated S3 Download**       | Retrieved artifact from storage buffer                    |        **PASS**         |
| 5    | **Decryption & Auth Tag Check** | Verified GCM authentication tag & matching SHA-256        |        **PASS**         |
| 6    | **Target Database Creation**    | Created clean isolated database `tixflow_restore_drill`   |        **PASS**         |
| 7    | **SQL Stream Restoration**      | Applied decrypted SQL stream into `tixflow_restore_drill` |        **PASS**         |
| 8    | **Data Integrity Verification** | Source tables: **26** \| Restored tables: **26**          |  **PASS (100% Match)**  |
| 9    | **Cleanup**                     | Dropped temporary drill database `tixflow_restore_drill`  |        **PASS**         |

- **Total Drill Duration:** 1,904 ms
- **Final Result:** **VERIFIED PASS**
- **Evidence Artifact:** `docs/qlda/evidence/backup-restore-drill.json`

---

## 4. Runbook for Operators

To reproduce the backup and restore drill locally:

```bash
# 1. Start isolated test container
docker compose -f infrastructure/docker-compose.test.yml up -d --wait

# 2. Run the automated backup & restore drill
node scripts/backup-restore-drill.mjs

# 3. Stop and clean up test container
docker compose -f infrastructure/docker-compose.test.yml down
```

## 5. Live Supabase backup and recovery (TF2-060)

The Supabase Free plan requires operator-managed backups. The live backup uses the
same Docker PostgreSQL tooling and AES-256-GCM used in the local TF2-040 drill.
It captures TixFlow's `public` schema and its data, including Prisma migration
history. Supabase-managed schemas, database roles and grants, object storage
files, and deployment secrets require their own recovery procedures.
[Supabase backup policy](https://supabase.com/kb/faqs/platform/free-plan-backups)

From the repository root, supply the current Supabase IPv4 session-pooler URL
as `TIXFLOW_BACKUP_SOURCE_URL` through the operator's secret store or current
shell session. Obtain the Supabase root CA from Database Settings and save it
as `.local/backup-secrets/supabase-ca.crt`, or set `TIXFLOW_BACKUP_CA_FILE`
to its path. The client uses `sslmode=verify-full` and read-only mode.
Supply `TIXFLOW_BACKUP_KEY` from the separate key store as 32 random bytes
encoded as 64 hex characters. Keep the URL and the raw key out of the shell
history, Git, and operation logs.
[Supabase SSL setup](https://supabase.com/docs/guides/platform/ssl-enforcement)

```sh
node scripts/supabase-backup.mjs backup
node scripts/supabase-backup.mjs restore BACKUP_FILENAME
```

Use the artifact basename printed by the first command. For restore, only the
matching backup key is needed. The restore command creates its own PostgreSQL 17
container with no network or published ports and a fresh database on tmpfs.
It authenticates the encrypted archive before restoring, requires `pg_restore`
to succeed in a single transaction, and checks the counts of application tables,
users, events, orders, tickets, and migrations. PostgreSQL's initialized empty
`public` namespace is reused. Both containers disable the Docker logging driver.
The restore container and its temporary data are removed when the command
finishes. The operator receives only metadata and aggregate counts.

On the Windows drill host the backup key is stored separately in
`.local/backup-secrets/tf2-060-key.dpapi` under the operator's Windows account.
That account can load it into a PowerShell session for either command.

```powershell
Add-Type -AssemblyName System.Security
$protectedKey = [IO.File]::ReadAllBytes((Resolve-Path .local/backup-secrets/tf2-060-key.dpapi).Path)
$key = [Security.Cryptography.ProtectedData]::Unprotect(
  $protectedKey, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser
)
$env:TIXFLOW_BACKUP_KEY = [BitConverter]::ToString($key).Replace('-', '')
[Array]::Clear($key, 0, $key.Length)
```

Clear the secret environment variables when finished. Keep the encrypted
artifacts in the host's ignored `.local/live-backups/` directory. The Windows
account that protected the key can decrypt them. Recovery of the laptop or
Windows profile itself requires a separately escrowed key and a second copy
of the archive. Both are **PENDING_HUMAN**. No artifact is published to Git,
GitHub Actions, S3, or the Supabase project.

The active trigger is a **manual operator run**. The operating target is
one backup per day while the demo is active and one before a live migration.
Review local copies weekly and retain 30 days of verified archives. There
is no scheduled job, automatic pruning, or guaranteed maximum gap between
backups. Keep at least one known-good restore point when applying retention.

The verified archive represents a consistent snapshot captured between
21:22:11.616 and 21:22:23.057 on 24 November 2026 (UTC+7). The observed
backup took 11.444 seconds. Restoring from the local encrypted archive
through successful count checks took 6.332 seconds. The snapshot was
34.3–45.7 seconds old at verification. Writes after that snapshot would
need to be recovered separately. This timing measures a database drill
from local storage and does not measure service cutover or off-host
retrieval. [Execution evidence](evidence/TF2-060-live-backup-restore.json)
