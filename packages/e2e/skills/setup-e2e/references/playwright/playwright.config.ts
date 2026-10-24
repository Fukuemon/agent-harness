// E2E のテストの設定の雛形。<e2e.dir>/playwright.config.ts に写し、<> の値を利用者のリポジトリの値に置き換える
import { defineConfig, devices } from '@playwright/test'
import { BASE_URL } from './tests/fixtures/env'
import { TIMEOUTS } from './tests/fixtures/timeouts'

export default defineConfig({
  testDir: 'tests',
  // spec はログインの状態のファイルを共有する。kit の ensureSavedLogin の文書コメントのとおり、並列の worker で共有しない
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: TIMEOUTS.test,
  expect: { timeout: TIMEOUTS.expect },
  reporter: process.env.CI ? [['list'], ['junit', { outputFile: 'test-results/junit.xml' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: BASE_URL,
    actionTimeout: TIMEOUTS.action,
    navigationTimeout: TIMEOUTS.navigation,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /setup\/.*\.setup\.ts/ },
    {
      name: 'e2e',
      testMatch: /tests\/specs\/.*\.e2e\.ts/,
      dependencies: ['setup'],
      use: { storageState: '<setup が保存するログインの状態のファイル>' },
    },
    // エビデンスは tests/fixtures/evidence.ts の captureEvidence が新しいコンテキストで撮り、prepare の中でログインするので、setup に依らない
    { name: 'evidence', testMatch: /tests\/evidence\/.*\.e2e\.ts/, timeout: TIMEOUTS.evidence },
  ],
})
