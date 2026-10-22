import { test, expect } from '@playwright/test';

test.describe('Auth Screens E2E Smoke Tests', () => {
  test('renders login page with email and password inputs and visibility toggle', async ({ page }) => {
    await page.goto('/auth/login');

    const emailInput = page.getByLabel(/البريد الإلكتروني|Email/i);
    const passwordInput = page.getByLabel(/كلمة المرور|Password/i);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Test password show/hide toggle
    const toggleEye = page.getByRole('button', { name: /إظهار|إخفاء|Show|Hide/i });
    if (await toggleEye.isVisible()) {
      await toggleEye.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }

    // Submit button should have min 44px height
    const submitBtn = page.getByRole('button', { name: /تسجيل الدخول|Sign in/i });
    await expect(submitBtn).toBeVisible();
    const box = await submitBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('renders signup page with validation and password confirmation', async ({ page }) => {
    await page.goto('/auth/signup');

    await expect(page.getByLabel(/الاسم الكامل|Full name/i)).toBeVisible();
    await expect(page.getByLabel(/بريد العمل|Business email/i)).toBeVisible();
    await expect(page.getByLabel(/^كلمة المرور|Password/i)).toBeVisible();
    await expect(page.getByLabel(/تأكيد كلمة المرور|Confirm password/i)).toBeVisible();

    // Link to login
    await expect(page.getByRole('link', { name: /تسجيل الدخول|Sign in/i })).toBeVisible();
  });

  test('renders forgot password page', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await expect(page.getByLabel(/البريد الإلكتروني|Email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /إرسال رابط الاستعادة|Send/i })).toBeVisible();
  });

  test('renders confirm email holding screen with resend link', async ({ page }) => {
    await page.goto('/auth/confirm-email?email=test%40merchant.eg');

    await expect(page.getByText(/تأكيد البريد الإلكتروني|Confirm Email/i)).toBeVisible();
    await expect(page.getByText('test@merchant.eg')).toBeVisible();
    await expect(page.getByRole('button', { name: /إعادة إرسال|Resend/i })).toBeVisible();
  });
});
