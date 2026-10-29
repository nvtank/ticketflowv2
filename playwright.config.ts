import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'foundation.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
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
        DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/unavailable',
        REDIS_URL: 'redis://127.0.0.1:2',
        API_PORT: '4100',
        CORS_ORIGINS: 'http://localhost:3100,http://127.0.0.1:3100',
        JWT_SECRET: 'test-only-authentication-secret-for-browser-foundation-tests-2026',
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
