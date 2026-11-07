import { execSync } from 'node:child_process';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CONTAINER = 'ticketflowv2-import-test-postgres-1';
const DB_USER = 'tixflow_test';
const SOURCE_DB = 'tixflow_test';
const DRILL_DB = 'tixflow_restore_drill';
const OUTPUT_DIR = resolve('.local/backup-drill');

console.log('=== [TixFlow V2] Database Encrypted Backup & Restore Drill ===');
const startTime = Date.now();

mkdirSync(OUTPUT_DIR, { recursive: true });

// 1. Generate AES-256 key and IV
const key = randomBytes(32);
const iv = randomBytes(12);

console.log('1. Exporting source PostgreSQL database dump...');
const rawDump = execSync(
  `docker exec ${CONTAINER} pg_dump -U ${DB_USER} -d ${SOURCE_DB} --clean --if-exists`,
  { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 },
);

const rawSha256 = createHash('sha256').update(rawDump).digest('hex');
console.log(`   Source SQL size: ${Buffer.byteLength(rawDump)} bytes, SHA-256: ${rawSha256}`);

// 2. Encrypt with AES-256-GCM
console.log('2. Encrypting dump with AES-256-GCM...');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(rawDump, 'utf8'), cipher.final()]);
const authTag = cipher.getAuthTag();

const backupFile = resolve(OUTPUT_DIR, 'tixflow_backup_drill.sql.enc');
const metaFile = resolve(OUTPUT_DIR, 'tixflow_backup_drill.meta.json');

const payload = Buffer.concat([iv, authTag, encrypted]);
writeFileSync(backupFile, payload);

const s3Destination = `s3://tixflow-encrypted-backups/drills/${new Date().toISOString().slice(0, 10)}/tixflow_drill.sql.enc`;
writeFileSync(
  metaFile,
  JSON.stringify(
    {
      s3Destination,
      algorithm: 'aes-256-gcm',
      sourceDb: SOURCE_DB,
      rawSha256,
      encryptedBytes: payload.byteLength,
      timestamp: new Date().toISOString(),
    },
    null,
    2,
  ),
);

console.log(`   Encrypted artifact saved: ${backupFile} (${payload.byteLength} bytes)`);
console.log(`   S3 Archive Target: ${s3Destination}`);

// 3. Decrypt and verify integrity
console.log('3. Simulating S3 retrieval, decrypting and verifying auth tag...');
const readPayload = readFileSync(backupFile);
const readIv = readPayload.subarray(0, 12);
const readTag = readPayload.subarray(12, 28);
const readEncrypted = readPayload.subarray(28);

const decipher = createDecipheriv('aes-256-gcm', key, readIv);
decipher.setAuthTag(readTag);
const decryptedSql = Buffer.concat([decipher.update(readEncrypted), decipher.final()]).toString(
  'utf8',
);

const decryptedSha256 = createHash('sha256').update(decryptedSql).digest('hex');
if (decryptedSha256 !== rawSha256) {
  throw new Error(`Checksum mismatch! Expected ${rawSha256}, got ${decryptedSha256}`);
}
console.log('   Checksum and Auth Tag verified. Decryption intact.');

// 4. Create isolated drill database and restore
console.log('4. Creating clean drill database in PostgreSQL container...');
execSync(
  `docker exec ${CONTAINER} psql -U ${DB_USER} -d postgres -c "DROP DATABASE IF EXISTS ${DRILL_DB};"`,
  { stdio: 'pipe' },
);
execSync(
  `docker exec ${CONTAINER} psql -U ${DB_USER} -d postgres -c "CREATE DATABASE ${DRILL_DB};"`,
  { stdio: 'pipe' },
);

console.log('5. Executing restore into drill database...');
execSync(`docker exec -i ${CONTAINER} psql -U ${DB_USER} -d ${DRILL_DB}`, {
  input: decryptedSql,
  stdio: ['pipe', 'pipe', 'pipe'],
});

// 5. Verify restored schema and tables
console.log('6. Verifying restored tables and structure...');
const sourceTableCount = parseInt(
  execSync(
    `docker exec ${CONTAINER} psql -U ${DB_USER} -d ${SOURCE_DB} -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"`,
    { encoding: 'utf-8' },
  ).trim(),
  10,
);

const drillTableCount = parseInt(
  execSync(
    `docker exec ${CONTAINER} psql -U ${DB_USER} -d ${DRILL_DB} -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"`,
    { encoding: 'utf-8' },
  ).trim(),
  10,
);

console.log(`   Source tables: ${sourceTableCount} | Restored tables: ${drillTableCount}`);
if (sourceTableCount !== drillTableCount) {
  throw new Error(
    `Table count mismatch! Source: ${sourceTableCount}, Restored: ${drillTableCount}`,
  );
}

// 6. Clean up drill database
console.log('7. Cleaning up temporary drill database...');
execSync(
  `docker exec ${CONTAINER} psql -U ${DB_USER} -d postgres -c "DROP DATABASE ${DRILL_DB};"`,
  { stdio: 'pipe' },
);

const durationMs = Date.now() - startTime;
console.log(`=== Restore Drill COMPLETED successfully in ${durationMs}ms ===`);

// 7. Output structured evidence
const evidence = {
  observed_date: new Date().toISOString().slice(0, 10),
  task: 'TF2-040',
  drill_type: 'encrypted_postgresql_backup_and_restore',
  environment: 'isolated_local_test_stack',
  container: CONTAINER,
  encryption: {
    algorithm: 'aes-256-gcm',
    key_length_bits: 256,
    iv_bytes: 12,
    auth_tag_bytes: 16,
    integrity_verified: true,
  },
  s3_destination_target: s3Destination,
  source_tables_count: sourceTableCount,
  restored_tables_count: drillTableCount,
  source_checksum_sha256: rawSha256,
  restored_checksum_sha256: decryptedSha256,
  status: 'VERIFIED_PASS',
  duration_ms: durationMs,
};

writeFileSync(
  resolve('docs/qlda/evidence/backup-restore-drill.json'),
  JSON.stringify(evidence, null, 2),
);
console.log('Evidence written to docs/qlda/evidence/backup-restore-drill.json');
