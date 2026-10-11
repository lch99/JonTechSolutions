// Animations must never cost content, layout stability or search-friendliness: every section is
// readable without JavaScript, with reduced motion and in print; nothing shifts while the page
// loads and scrolls; and the main heading paints promptly.
import { test, expect } from '@playwright/test';
import { SRC_PAGES, open, frame, theme, toggleTheme } from './helpers.mjs';

const hiddenReveals = page => page.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).opacity !== '1').length);
async function scrollThrough(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) { await page.evaluate(top => scrollTo(0, top), y); await page.waitForTimeout(60); }
  // A scroll this fast can pass a section before the browser notices it; stop at each one still waiting
  await page.evaluate(async () => {
    for (const el of document.querySelectorAll('.reveal:not(.visible)')) {
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      for (let i = 0; i < 40 && !el.classList.contains('visible'); i++) await new Promise(r => setTimeout(r, 50));
    }
  });
  await page.waitForTimeout(1300);
}

test('without JavaScript every section is visible', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ ...info.project.use, baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  for (const url of ['index.html', 'services/pos-system.html', 'zh/contact.html']) {
    await page.goto(url);
    expect(await page.locator('.reveal').count(), url).toBeGreaterThan(5);
    // poll: the hero's own entrance animation is pure CSS and still plays
    await expect.poll(() => hiddenReveals(page), `${url}: hidden sections`).toBe(0);
    await expect(page.locator('h1')).toBeVisible();
  }
  await context.close();
});

test('sections fade in as they are scrolled to, and all end up visible', async ({ page }) => {
  await open(page, 'index.html');
  expect(await hiddenReveals(page), 'sections below the fold start hidden').toBeGreaterThan(10);
  await scrollThrough(page);
  expect(await hiddenReveals(page)).toBe(0);
});

test('reduced motion: content is all there and nothing keeps moving', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('index.html');
  expect(await hiddenReveals(page)).toBe(0);
  await scrollThrough(page);
  const moving = () => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect.getComputedTiming().duration > 50)
    .map(a => `${a.animationName || a.transitionProperty} on ${a.effect.target && (a.effect.target.className || a.effect.target.tagName)}`));
  await expect.poll(moving).toEqual([]);
  expect(await page.evaluate(() => getComputedStyle(document.body, '::before').content), 'no scroll progress bar').toBe('none');
});

test('print shows every section', async ({ page }) => {
  await open(page, 'services/it-services.html');
  await page.emulateMedia({ media: 'print' });
  expect(await hiddenReveals(page)).toBe(0);
});

test('switching theme cross-fades, then settles', async ({ page }) => {
  await open(page, 'index.html', 'light');
  await toggleTheme(page);
  expect(await theme(page)).toBe('dark');
  await expect(page.locator('html')).not.toHaveClass(/theme-switching/);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(23, 23, 26)');
});

test('cards track the pointer for their glow', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no hover on touch screens');
  await open(page, 'index.html');
  const card = page.locator('.svc-card').first();
  await card.scrollIntoViewIfNeeded();
  await card.hover({ position: { x: 40, y: 30 } });
  await expect.poll(() => card.evaluate(c => c.style.getPropertyValue('--mx'))).toMatch(/^\d+(\.\d+)?px$/);
});

// Layout stability and paint timing, as search engines measure them (Chrome only exposes these)
for (const url of SRC_PAGES) {
  test(`no layout shift, prompt first paint: ${url}`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'layout-shift and LCP entries are Chromium-only');
    await page.addInitScript(() => {
      window.__cls = 0; window.__shifts = []; window.__lcp = null;
      new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(`${e.value.toFixed(4)} ${e.sources.map(s => s.node && (s.node.className || s.node.nodeName)).join(',')}`); } }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(list => { const e = list.getEntries().pop(); window.__lcp = { time: e.startTime, tag: e.element && e.element.tagName }; }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    for (const scheme of ['light', 'dark']) {
      await open(page, url, scheme);
      // read the largest paint before scrolling: later, bigger sections would replace it
      const lcp = await page.evaluate(() => window.__lcp);
      await scrollThrough(page);
      const { cls, shifts } = await page.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts }));
      expect.soft(cls, `${scheme}: layout shift (good is under 0.1) ${shifts.join(' | ')}`).toBeLessThan(0.02);
      expect.soft(lcp && lcp.time, `${scheme}: largest paint, ${lcp && lcp.tag}`).toBeLessThan(1500);
    }
  });
}
