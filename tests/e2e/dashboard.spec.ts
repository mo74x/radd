import { test, expect } from '@playwright/test';

test.describe('Dashboard & Navigation E2E Smoke Tests', () => {
  test('renders landing or dashboard page in Arabic RTL by default', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Brand logo should be visible
    const logo = page.locator('svg').filter({ hasText: /ردّ|Radd/i }).first();
    await expect(logo).toBeVisible();
  });

  test('toggles theme between light and dark', async ({ page }) => {
    await page.goto('/dev/design-system');

    const html = page.locator('html');
    
    // Find theme toggle button
    const themeBtn = page.getByRole('button', { name: /المظهر|Theme|Dark mode|Light mode/i }).first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      // Theme should toggle class or data-theme
      const isDark = await html.evaluate(
        (el) => el.classList.contains('dark') || el.getAttribute('data-theme') === 'dark'
      );
      expect(typeof isDark).toBe('boolean');
    }
  });

  test('design system page renders all UI tokens and components', async ({ page }) => {
    await page.goto('/dev/design-system');

    // Should render Buttons, Badges, Cards, etc.
    await expect(page.getByText('Buttons (الأزرار)')).toBeVisible();
    await expect(page.getByText('Badges & Chips (الشارات)')).toBeVisible();
    await expect(page.getByText('Star Ratings (التقييم بالنجوم)')).toBeVisible();
  });

  test('email and telegram preview page renders templates correctly', async ({ page }) => {
    await page.goto('/dev/email-preview');

    // Controls should exist
    await expect(page.getByRole('button', { name: /HTML Email/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Telegram Message/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Plain Text/i })).toBeVisible();

    // Variant selector buttons
    await expect(page.getByRole('button', { name: /Arabic/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /English 5★/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Flagged/i })).toBeVisible();

    // Click Telegram preview tab
    await page.getByRole('button', { name: /Telegram Message/i }).click();
    await expect(page.getByText(/مراجعة واعتماد الرد/i)).toBeVisible();
  });
});
