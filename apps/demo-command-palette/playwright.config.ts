import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {defineConfig, devices} from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  reporter: 'list',
  outputDir: path.resolve(
    __dirname,
    '../../.codex-tmp/playwright/demo-command-palette'
  ),
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node ./e2e/serve-output.mjs',
    cwd: __dirname,
    reuseExistingServer: true,
    timeout: 120_000,
    url: 'http://127.0.0.1:4173',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
