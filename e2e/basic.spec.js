import { test, expect } from '@playwright/test';

test('load the app and check for errors', async ({ page }) => {
  // 1. Navigate to the app
  await page.goto('http://localhost:8080');

  // 2. Setup console error tracking
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 3. Assertions
  await expect(page).toHaveTitle(/Task/i);

  // 4. Final checks
  await page.waitForLoadState('networkidle');
  expect(consoleErrors).toHaveLength(0);
});