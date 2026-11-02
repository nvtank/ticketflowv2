import { defineConfig, devices } from '@playwright/test';
import experience from './playwright.experience.config';

export default defineConfig({
  ...experience,
  projects: [
    {
      name: 'small-mobile-chromium',
      use: { ...devices['Pixel 7'], viewport: { width: 320, height: 740 } },
    },
  ],
});
