// Light / dark theme: follows the system, the visitor can override it, and the logo matches.
import { test, expect } from '@playwright/test';
import { open, theme, savedTheme, css, toggleTheme } from './helpers.mjs';

const LIGHT = { paper: 'rgb(255, 255, 255)', ink: 'rgb(29, 29, 31)' };
const DARK = { paper: 'rgb(23, 23, 26)', ink: 'rgb(245, 245, 247)' };

test('light system → light theme with the light logo', async ({ page }) => {
  await open(page, 'index.html', 'light');
  expect(await theme(page)).toBe('light');
  expect(await css(page, 'body', 'backgroundColor')).toBe(LIGHT.paper);
  expect(await css(page, 'body', 'color')).toBe(LIGHT.ink);
  expect(await css(page, '.footer-logo .logo-mark', 'backgroundImage')).toContain('logo-mark-light.png');
  expect(await savedTheme(page), 'nothing is saved until the visitor chooses').toBeNull();
});

test('dark system → dark theme with the dark logo', async ({ page }) => {
  await open(page, 'index.html', 'dark');
  expect(await theme(page)).toBe('dark');
  expect(await css(page, 'body', 'backgroundColor')).toBe(DARK.paper);
  expect(await css(page, 'body', 'color')).toBe(DARK.ink);
  expect(await css(page, '.footer-logo .logo-mark', 'backgroundImage')).toContain('logo-mark-dark.png');
  expect(await css(page, 'html', 'colorScheme')).toBe('dark');
});

test('follows the system when it changes while the page is open', async ({ page }) => {
  await open(page, 'services/pos-system.html', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(() => theme(page)).toBe('dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => theme(page)).toBe('light');
});

test('theme is set before the page starts rendering (no flash)', async ({ page }) => {
  await page.addInitScript(() => {
    new MutationObserver((_, o) => {
      if (document.body) { window.__themeAtBody = document.documentElement.dataset.theme || '(unset)'; o.disconnect(); }
    }).observe(document, { childList: true, subtree: true });
  });
  await open(page, 'zh/index.html', 'dark');
  expect(await page.evaluate(() => window.__themeAtBody)).toBe('dark');
});

test('the visitor can switch theme, and the choice sticks', async ({ page }) => {
  await open(page, 'index.html', 'light');
  await toggleTheme(page);
  expect(await theme(page)).toBe('dark');
  expect(await savedTheme(page)).toBe('dark');
  await expect.poll(() => css(page, 'body', 'backgroundColor'), 'once the cross-fade ends').toBe(DARK.paper);

  await page.reload();
  expect(await theme(page), 'after a reload').toBe('dark');
  await page.goto('ms/services/web-development.html');
  expect(await theme(page), 'on another page').toBe('dark');

  await toggleTheme(page);
  expect(await theme(page)).toBe('light');
  expect(await savedTheme(page)).toBe('light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  expect(await theme(page), 'an explicit choice wins over the system').toBe('light');
});

test('the theme button shows a moon in light and a sun in dark', async ({ page }) => {
  await open(page, 'contact.html', 'light');
  const control = (await page.locator('.nav-links .theme-toggle').isVisible()) ? '.nav-links .theme-toggle' : '.mobile-theme';
  if (control === '.mobile-theme') await page.locator('#navToggle').click();
  await expect(page.locator(`${control} .icon-moon`)).toBeVisible();
  await expect(page.locator(`${control} .icon-sun`)).toBeHidden();
  await page.locator(control).click();
  await expect(page.locator(`${control} .icon-sun`)).toBeVisible();
  await expect(page.locator(`${control} .icon-moon`)).toBeHidden();
});

test('a choice made in another tab, or before pressing Back, is picked up', async ({ page }) => {
  await open(page, 'index.html', 'light');
  await page.evaluate(() => { localStorage.setItem('jontech-theme', 'dark'); dispatchEvent(new StorageEvent('storage', { key: 'jontech-theme' })); });
  expect(await theme(page)).toBe('dark');
  await page.evaluate(() => { localStorage.setItem('jontech-theme', 'light'); dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
  expect(await theme(page)).toBe('light');
});

test('printing uses the light theme', async ({ page }) => {
  await open(page, 'services/it-services.html', 'dark');
  await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
  expect(await theme(page)).toBe('light');
  await page.evaluate(() => dispatchEvent(new Event('afterprint')));
  expect(await theme(page)).toBe('dark');
});

test('a junk saved value falls back to the system', async ({ page }) => {
  await open(page, 'index.html', 'dark');
  await page.evaluate(() => localStorage.setItem('jontech-theme', 'banana'));
  await page.reload();
  expect(await theme(page)).toBe('dark');
});

test('the bar behind the nav follows the theme once scrolled', async ({ page }) => {
  await open(page, 'index.html', 'dark');
  await page.evaluate(() => scrollTo(0, 600));
  await expect(page.locator('#nav')).toHaveClass(/scrolled/);
  await expect.poll(() => css(page, '#nav', 'backgroundColor')).toBe('rgba(23, 23, 26, 0.8)');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect.poll(() => css(page, '#nav', 'backgroundColor')).toBe('rgba(255, 255, 255, 0.8)');
});
