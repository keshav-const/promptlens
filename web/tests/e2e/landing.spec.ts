import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Welcome to Dashboard');
  });

  test('should display sign in button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });
});
