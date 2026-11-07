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
