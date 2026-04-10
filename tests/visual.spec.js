import { test, expect } from '@playwright/test';

test.describe('visual regression', () => {
  test('homepage english light mode', async ({ page }) => {
    await page.goto('/index.html');
    await page.addStyleTag({ content: '* { caret-color: transparent !important; }' });
    await expect(page).toHaveScreenshot('homepage-en-light.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    });
  });

  test('homepage chinese light mode', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#langToggle');
    await page.addStyleTag({ content: '* { caret-color: transparent !important; }' });
    await expect(page).toHaveScreenshot('homepage-zh-light.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    });
  });
});
