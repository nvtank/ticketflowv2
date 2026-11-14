#!/usr/bin/env node
/**
 * NixOS-only developer setup for the Prisma CLI.
 *
 * Prisma publishes no engine build for the `linux-nixos` target, so on NixOS
 * every CLI command (`prisma generate`, `migrate`, `db seed`) dies with a 404
 * while fetching `linux-nixos/schema-engine.gz`. This script downloads the
 * official `debian-openssl-3.0.x` schema-engine for the exact engines commit
 * the installed CLI expects (from `@prisma/engines-version`), which runs fine
 * under nix-ld, and records its path in the gitignored `apps/api/.env` that
 * `apps/api/prisma.config.ts` loads.
 *
 * Safe to re-run; it is a no-op when everything is already in place.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ENV_FILE = path.join(ROOT, 'apps/api/.env');
const ENV_KEY = 'PRISMA_SCHEMA_ENGINE_BINARY';

const osRelease = existsSync('/etc/os-release') ? readFileSync('/etc/os-release', 'utf8') : '';
if (!/^ID=nixos$/m.test(osRelease)) {
  console.log('Not NixOS; Prisma downloads its own engines here. Nothing to do.');
  process.exit(0);
}
if (!existsSync('/lib64/ld-linux-x86-64.so.2')) {
  console.error(
    'nix-ld is not enabled (no /lib64/ld-linux-x86-64.so.2); the debian engine cannot run. Enable programs.nix-ld in your NixOS config first.',
  );
  process.exit(1);
}

// pnpm's strict layout means @prisma/engines-version is only resolvable from
// the package that depends on it, so walk the chain: apps/api -> prisma ->
// @prisma/engines -> @prisma/engines-version.
let resolver = createRequire(path.join(ROOT, 'apps/api/package.json'));
for (const pkg of ['prisma', '@prisma/engines'])
  resolver = createRequire(resolver.resolve(`${pkg}/package.json`));
const { enginesVersion } = resolver('@prisma/engines-version');
const dir = path.join(ROOT, '.local/prisma-engines', enginesVersion);
const binary = path.join(dir, 'schema-engine');

if (!existsSync(binary)) {
  const url = `https://binaries.prisma.sh/all_commits/${enginesVersion}/debian-openssl-3.0.x/schema-engine.gz`;
  console.log(`Downloading ${url}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(binary, gunzipSync(Buffer.from(await response.arrayBuffer())));
  chmodSync(binary, 0o755);
}

const reported = execFileSync(binary, ['--version'], { encoding: 'utf8' }).trim();
if (!reported.includes(enginesVersion))
  throw new Error(`Engine at ${binary} reports "${reported}", expected commit ${enginesVersion}`);

const line = `${ENV_KEY}=${binary}`;
let env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
if (env.includes(line)) {
  console.log(`OK: ${reported} already wired via ${ENV_FILE}`);
} else {
  env = env
    .split('\n')
    .filter((l) => !l.startsWith(`${ENV_KEY}=`))
    .join('\n')
    .replace(/\n*$/, '\n');
  writeFileSync(ENV_FILE, `${env}${line}\n`);
  console.log(`Wired ${reported} into ${ENV_FILE}`);
}
