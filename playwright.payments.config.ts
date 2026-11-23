import { defineConfig } from '@playwright/test';
import auth from './playwright.auth.config';

export default defineConfig({
  ...auth,
  testMatch: 'payments.spec.ts',
  timeout: 90000,
  webServer: Array.isArray(auth.webServer)
    ? auth.webServer.map((server, index) =>
        index === 1
          ? {
              ...server,
              env: {
                ...server.env,
                ENABLE_DEV_PAYMENTS: 'true',
              },
            }
          : server,
      )
    : auth.webServer,
});
