import { defineConfig, devices } from '@playwright/test';

const port = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // One browser at a time in CI: the smoke tests measure the page's own frame rate, which
  // parallel browsers on a small runner would distort.
  ...(process.env.CI ? { workers: 1 } : {}),
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}/learn-math/`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // Some environments ship their own Chromium; CI uses Playwright's.
          ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
          // Software WebGL so the live renderer also runs on GPU-less machines.
          args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
        },
      },
    },
  ],
  webServer: {
    command: `npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}/learn-math/`,
    reuseExistingServer: !process.env.CI,
  },
});
