import { expect, test } from '@playwright/test';

test('guests are redirected from the ledger to login', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole('heading', { name: 'Enter the household passcode' }),
  ).toBeVisible();
});

test('login page renders the passcode form', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByLabel('Passcode')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Unlock ledger' }),
  ).toBeVisible();
});
