import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1, // Electron E2E shouldn't run in parallel for the same state/DB
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev:vite',
    port: 5173,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
