import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import console from 'node:console';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { URL } from 'node:url';

const directory = resolve('.local/live-backups');
const image = 'postgres:17-alpine';
const magic = Buffer.from('TF2B2');
const artifactPattern = /^tixflow-public-\d{4}-\d{2}-\d{2}T[\d-]+Z\.pgdump\.enc$/;

function docker(args, input) {
  try {
    return execFileSync('docker', args, {
      input,
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 128 * 1024 * 1024,
      timeout: 15 * 60 * 1000,
    });
  } catch (error) {
    const diagnostic = error.stderr?.toString() ?? '';
    // Do not propagate libpq diagnostics, which may contain connection details or data.
    if (/password authentication failed|tenant or user not found/i.test(diagnostic))
      throw new Error('Supabase rejected the session-pooler credentials.');
    if (/certificate|SSL error/i.test(diagnostic))
      throw new Error('Supabase TLS certificate verification failed.');
    if (
      /could not translate host|could not connect|connection timed out|network is unreachable/i.test(
        diagnostic,
      )
    )
      throw new Error('Could not reach the PostgreSQL server.');
    if (/server version mismatch/i.test(diagnostic))
      throw new Error('The Supabase server is newer than the PostgreSQL client image.');
    if (/role .* does not exist/i.test(diagnostic))
      throw new Error('Restore requires a role referenced by the archived schema.');
    if (/extension .* is not available/i.test(diagnostic))
      throw new Error('Restore requires a PostgreSQL extension absent from the isolated image.');
    const stage = diagnostic
      .match(/TF2_STAGE=(init|start|create|restore|verify|stop)/g)
      ?.at(-1)
      ?.slice(10);
    const reason = /already exists/i.test(diagnostic)
      ? 'object already exists'
      : /permission denied/i.test(diagnostic)
        ? 'permission denied'
        : /input file is too short|end of file/i.test(diagnostic)
          ? 'incomplete archive'
          : 'see isolated client diagnostics';
    throw new Error(
      `PostgreSQL ${stage ?? 'container command'} failed (${reason}; exit ${error.status ?? 'unknown'}).`,
    );
  }
}

function source() {
  let url;
  try {
    url = new URL(process.env.TIXFLOW_BACKUP_SOURCE_URL ?? '');
  } catch {
    throw new Error('Set TIXFLOW_BACKUP_SOURCE_URL to the Supabase session-pooler URL.');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !/^aws-[a-z0-9-]+\.pooler\.supabase\.com$/i.test(url.hostname) ||
    !['', '5432'].includes(url.port) ||
    url.pathname !== '/postgres' ||
    !/^[a-z0-9_]+\.[a-z0-9]+$/i.test(decodeURIComponent(url.username)) ||
    !url.password
  ) {
    throw new Error(
      'Expected a Supabase shared session-pooler URL for database postgres on port 5432.',
    );
  }
  const password = decodeURIComponent(url.password);
  if (/[\r\n\0]/.test(password)) throw new Error('Unsupported character in the database password.');
  return { host: url.hostname, username: decodeURIComponent(url.username), password };
}

function backup(key) {
  const connection = source();
  const ca = readFileSync(
    process.env.TIXFLOW_BACKUP_CA_FILE ?? resolve('.local/backup-secrets/supabase-ca.crt'),
  );
  const started = new Date();
  const dump = docker(
    [
      'run',
      '--rm',
      '--log-driver',
      'none',
      '-i',
      '--entrypoint',
      'sh',
      '-e',
      `PGHOST=${connection.host}`,
      '-e',
      `PGUSER=${connection.username}`,
      '-e',
      'PGPORT=5432',
      '-e',
      'PGDATABASE=postgres',
      '-e',
      'PGCONNECT_TIMEOUT=12',
      '-e',
      'PGSSLMODE=verify-full',
      '-e',
      'PGSSLROOTCERT=/tmp/supabase-ca.crt',
      '-e',
      'PGOPTIONS=-c default_transaction_read_only=on',
      image,
      '-ec',
      `IFS= read -r PGPASSWORD
       export PGPASSWORD
       cat >/tmp/supabase-ca.crt
       exec pg_dump --no-password --format=custom --schema=public --no-owner --no-acl --lock-wait-timeout=5s`,
    ],
    Buffer.concat([Buffer.from(connection.password + '\n'), ca]),
  );
  const capturedBy = new Date();
  try {
    if (dump.subarray(0, 5).toString() !== 'PGDMP') throw new Error('Invalid PostgreSQL archive.');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(magic);
    const ciphertext = Buffer.concat([cipher.update(dump), cipher.final()]);
    const artifact = Buffer.concat([magic, iv, cipher.getAuthTag(), ciphertext]);
    const name = `tixflow-public-${started.toISOString().replace(/[:.]/g, '-')}.pgdump.enc`;
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    writeFileSync(resolve(directory, name), artifact, { flag: 'wx', mode: 0o600 });
    console.log(
      JSON.stringify({
        operation: 'backup',
        artifact: name,
        snapshotEarliestUtc: started.toISOString(),
        snapshotLatestUtc: capturedBy.toISOString(),
        backupDurationMs: Date.now() - started.getTime(),
        encryptedBytes: artifact.length,
        encryptedSha256: createHash('sha256').update(artifact).digest('hex'),
      }),
    );
  } finally {
    dump.fill(0);
  }
}

function restore(key, name) {
  if (!artifactPattern.test(name ?? ''))
    throw new Error('Provide a backup filename from .local/live-backups.');
  const started = Date.now();
  const artifact = readFileSync(resolve(directory, name));
  if (!artifact.subarray(0, 5).equals(magic) || artifact.length <= 33)
    throw new Error('Invalid encrypted backup header.');
  const decipher = createDecipheriv('aes-256-gcm', key, artifact.subarray(5, 17));
  decipher.setAAD(magic);
  decipher.setAuthTag(artifact.subarray(17, 33));
  const clear = decipher.update(artifact.subarray(33));
  try {
    // GCM must authenticate before any plaintext reaches the restore process.
    decipher.final();
    const result = docker(
      [
        'run',
        '--rm',
        '--log-driver',
        'none',
        '--network',
        'none',
        '-i',
        '--user',
        'postgres',
        '--tmpfs',
        '/restore:rw,noexec,nosuid,size=1g,mode=1777',
        '--entrypoint',
        'sh',
        image,
        '-ec',
        `echo TF2_STAGE=init >&2
         initdb -D /restore/db --auth=trust --no-locale --encoding=UTF8 >/dev/null
         echo TF2_STAGE=start >&2
         pg_ctl -D /restore/db -l /restore/server.log -o "-c listen_addresses= -k /restore" -w start >/dev/null
         export PGHOST=/restore PGUSER=postgres
         echo TF2_STAGE=create >&2
         createdb --template=template0 tixflow_live_restore
         echo TF2_STAGE=restore >&2
         cat >/restore/archive.pgdump
         pg_restore --list /restore/archive.pgdump >/restore/contents
         # The fresh database from template0 already contains the public namespace.
         sed '/^[0-9][0-9]*; [0-9][0-9]* [0-9][0-9]* SCHEMA - public /d' /restore/contents >/restore/app-contents
         pg_restore --exit-on-error --single-transaction --no-owner --no-acl \
           --use-list=/restore/app-contents --dbname=tixflow_live_restore /restore/archive.pgdump
         echo TF2_STAGE=verify >&2
         psql -XAt --set=ON_ERROR_STOP=1 --dbname=tixflow_live_restore <<'SQL'
           SELECT json_build_object(
             'publicTables', (SELECT count(*) FROM pg_tables WHERE schemaname='public'),
             'users', (SELECT count(*) FROM public."User"),
             'events', (SELECT count(*) FROM public."Event"),
             'orders', (SELECT count(*) FROM public."Order"),
             'tickets', (SELECT count(*) FROM public."Ticket"),
             'migrations', (SELECT count(*) FROM public."_prisma_migrations")
           );
SQL
         echo TF2_STAGE=stop >&2
         pg_ctl -D /restore/db -m fast -w stop >/dev/null`,
      ],
      clear,
    );
    console.log(
      JSON.stringify({
        operation: 'restore',
        artifact: name,
        encryptedSha256: createHash('sha256').update(artifact).digest('hex'),
        authenticated: true,
        finishedAtUtc: new Date().toISOString(),
        restoreDurationMs: Date.now() - started,
        counts: JSON.parse(result.toString()),
      }),
    );
  } finally {
    clear.fill(0);
  }
}

try {
  const [, , action, name, ...extra] = process.argv;
  if (extra.length || !((action === 'backup' && name === undefined) || action === 'restore'))
    throw new Error('Usage: node scripts/supabase-backup.mjs backup | restore BACKUP_FILENAME');
  const encoded = process.env.TIXFLOW_BACKUP_KEY ?? '';
  if (!/^[a-f0-9]{64}$/i.test(encoded))
    throw new Error(
      'Set TIXFLOW_BACKUP_KEY to a securely stored random 32-byte key encoded as hex.',
    );
  const key = Buffer.from(encoded, 'hex');
  try {
    if (action === 'backup') backup(key);
    else restore(key, name);
  } finally {
    key.fill(0);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
