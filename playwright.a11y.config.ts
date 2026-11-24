import { defineConfig } from '@playwright/test';
import auth from './playwright.auth.config';

export default defineConfig({
  ...auth,
  testMatch: 'a11y.spec.ts',
  timeout: 120_000,
  use: { ...auth.use, screenshot: 'only-on-failure' },
});
