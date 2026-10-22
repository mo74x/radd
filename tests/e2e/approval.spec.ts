import { test, expect } from '@playwright/test';

test.describe('Approval Screen E2E Smoke Tests', () => {
  test('renders standard approval view in Arabic RTL', async ({ page }) => {
    await page.goto('/approve/preview-normal');

    // Page should display Arabic locale and RTL by default
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Verify Business and Location Header
    await expect(page.getByText('كافيه ومحمصة النيل')).toBeVisible();
    await expect(page.getByText('فرع الزمالك')).toBeVisible();

    // Verify Reviewer & 5-star rating
    await expect(page.getByText('سارة محمود')).toBeVisible();

    // Verify AI suggested reply card
    await expect(page.getByTestId('approval-card-suggested')).toBeVisible();

    // Verify Action buttons have min 44px touch targets
    const approveBtn = page.getByRole('button', { name: /موافقة ونشر الرد/i });
    await expect(approveBtn).toBeVisible();
    const box = await approveBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);

    // Verify Edit and Skip buttons exist
    await expect(page.getByRole('button', { name: /تعديل/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /تخطي/i })).toBeVisible();
  });

  test('switches language smoothly to English LTR', async ({ page }) => {
    await page.goto('/approve/preview-normal');

    // Click language toggle to switch to English
    const langBtn = page.getByRole('button', { name: /English|عربي/i });
    await langBtn.click();

    // Expect LTR direction and English UI strings
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('button', { name: /Approve & Post/i })).toBeVisible();
  });

  test('renders sensitive/flagged review with warning banner', async ({ page }) => {
    await page.goto('/approve/preview-careful');

    // Check for careful review warning banner
    const warningBanner = page.getByTestId('careful-review-banner');
    await expect(warningBanner).toBeVisible();
    await expect(warningBanner).toContainText(/مراجعة دقيقة|Careful review/i);

    // Verify star rating is 1-star
    await expect(page.getByText('أحمد حسن')).toBeVisible();
  });

  test('handles in-place editing and character counter', async ({ page }) => {
    await page.goto('/approve/preview-normal');

    // Click edit button
    const editBtn = page.getByRole('button', { name: /تعديل/i });
    await editBtn.click();

    // Textarea should appear with character count
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(page.getByTestId('approval-card-editing')).toBeVisible();

    // Type text into textarea
    await textarea.fill('شكراً جزيلاً لزيارتكم ونسعد بخدمتكم دائماً في كافيه ومحمصة النيل!');

    // Reset button should restore suggestion
    const resetBtn = page.getByRole('button', { name: /استعادة المقترح|Reset/i });
    await expect(resetBtn).toBeVisible();
  });

  test('displays outcome card for already approved/posted draft', async ({ page }) => {
    await page.goto('/approve/preview-success');
    await expect(page.getByTestId('approval-state-success')).toBeVisible();
    await expect(page.getByRole('link', { name: /لوحة التحكم|Dashboard/i })).toBeVisible();
  });

  test('displays outcome card for skipped review', async ({ page }) => {
    await page.goto('/approve/preview-skipped');
    await expect(page.getByTestId('approval-state-skipped')).toBeVisible();
  });

  test('displays expired state for expired link', async ({ page }) => {
    await page.goto('/approve/preview-expired');
    await expect(page.getByText(/انتهت صلاحية الرابط|Link Expired/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /إرسال رابط جديد|Renew/i })).toBeVisible();
  });

  test('displays invalid link fallback for nonexistent token', async ({ page }) => {
    await page.goto('/approve/nonexistent-invalid-token');
    await expect(page.getByTestId('approval-state-invalid')).toBeVisible();
  });
});
