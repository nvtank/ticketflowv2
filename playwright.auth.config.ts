import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testMatch: 'auth.spec.ts',
  webServer: [
    {
      command: 'pnpm --filter @tixflow/api start',
      url: 'http://127.0.0.1:4100/api/v1/health/live',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NODE_ENV: 'test',
        GOOGLE_CLIENT_ID: '',
        PAYMENT_PROVIDER: 'mock',
        TICKET_SIGNING_KEY: 'test-only-persistent-ticket-signing-key-for-isolated-database-2026',
        PAYMENT_RETURN_ORIGIN: 'http://127.0.0.1:3100',
        PAYMENT_RECONCILE_INTERVAL_MS: '0',
        DATABASE_URL:
          process.env.TEST_DATABASE_URL ??
          'postgresql://tixflow_test:tixflow_test_only@127.0.0.1:55443/tixflow_test',
        REDIS_URL: process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:56393',
        API_PORT: '4100',
        CORS_ORIGINS: 'http://localhost:3100,http://127.0.0.1:3100',
        JWT_SECRET: 'test-only-authentication-secret-for-browser-authentication-tests-2026',
      },
    },
    {
      command: 'pnpm --filter @tixflow/web start',
      url: 'http://127.0.0.1:3100',
      reuseExistingServer: false,
      timeout: 120_000,
      env: { NODE_ENV: 'production', API_INTERNAL_URL: 'http://127.0.0.1:4100' },
    },
  ],
});
