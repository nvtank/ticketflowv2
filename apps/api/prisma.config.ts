import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// A prisma.config.ts disables the CLI's automatic .env loading, so load the
// gitignored machine-local ./.env here (never overriding real environment
// variables). NixOS machines use it to point PRISMA_SCHEMA_ENGINE_BINARY at
// a runnable engine build; see scripts/setup-prisma-nixos.mjs.
loadEnv({ path: './.env', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'node dist/seed.js' },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://unused:unused@localhost:5432/unused',
  },
});
