import { defineConfig } from '@playwright/test';
import auth from './playwright.auth.config';

export default defineConfig({ ...auth, testMatch: 'contact.spec.ts' });
