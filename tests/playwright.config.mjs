// Browser tests for the site: Chrome, Firefox and Safari's engine on desktop, plus phone and tablet profiles.
// Setup (once):  cd tests && npm install && npm run browsers
// Usage:         npm test                     static checks, then every browser
//                npx playwright test --project=iphone-15
//                npx playwright test theme    one spec file
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.mjs',
  outputDir: 'test-results',
  fullyParallel: true,
  retries: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, colorScheme: 'light' },
  webServer: { command: `node serve.mjs ${PORT}`, url: `http://127.0.0.1:${PORT}/`, reuseExistingServer: true },
  projects: [
    { name: 'chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'safari', use: { ...devices['Desktop Safari'] } },
    { name: 'iphone-15', use: { ...devices['iPhone 15'] } },
    { name: 'iphone-se', use: { ...devices['iPhone SE'] } },
    { name: 'galaxy-s24', use: { ...devices['Galaxy S24'] } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'ipad-mini', use: { ...devices['iPad Mini'] } },
  ],
});
