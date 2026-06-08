import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  workers:  1,
  reporter: [['html'], ['list']],
  use: {
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'api-testing',
      testMatch: 'example*',
      dependencies: ['smoke-tests']
    },
    {
      name:'smoke-tests',
      testMatch: 'smoke*',
      dependencies: ['negative-tests']
    }
    ,
    {
      name:'negative-tests',
      testMatch: 'negative*',
    }

  ],
});
