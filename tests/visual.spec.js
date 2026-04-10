import { test, expect } from '@playwright/test';

async function preparePage(page, lang = 'en') {
  await page.addInitScript((mode) => {
    localStorage.setItem('cl-lang', mode);
    localStorage.setItem('cl-theme', 'light');
    localStorage.removeItem('cl-pubs-expanded');
  }, lang);
  await page.goto('/index.html');
  await page.addStyleTag({ content: '* { caret-color: transparent !important; }' });
  await page.waitForLoadState('networkidle');
}

test.describe('visual regression', () => {
  test('homepage english light mode', async ({ page }) => {
    await preparePage(page, 'en');
    await expect(page).toHaveScreenshot('homepage-en-light.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    });
  });

  test('homepage chinese light mode', async ({ page }) => {
    await preparePage(page, 'zh');
    await expect(page).toHaveScreenshot('homepage-zh-light.png', {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    });
  });
});
