// The demo websites (demo/*.html): made-up client sites the private brochure links to. Each one loads
// cleanly, fits every screen, links to the others, and explains its buttons instead of leaving the page.
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { ROOT, WIDTHS, frame, watchErrors } from './helpers.mjs';

const DEMOS = fs.readdirSync(path.join(ROOT, 'demo')).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of DEMOS) {
  const url = `demo/${file}`;

  test(`${url} loads, fits every width and links to the other demos`, async ({ page, isMobile }) => {
    test.setTimeout(120_000);
    const errors = watchErrors(page);
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.demo-tag b'), 'marked as a demo').toBeVisible();
    await expect(page.locator(`.demo-tabs a[href="${file}"]`)).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.demo-tabs a')).toHaveCount(DEMOS.length);
    for (const tab of await page.locator('.demo-tabs a').all()) await expect(tab, 'every tab can be seen').toBeInViewport({ ratio: 1 });
    // Load the lazy images too, then check every one arrived
    await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; }));
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.src))).toEqual([]);
    for (const width of isMobile ? [null] : WIDTHS) {
      if (width) { await page.setViewportSize({ width, height: 800 }); await frame(page); }
      expect.soft(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${width ?? 'device'}: sideways overflow`).toBe(0);
    }
    expect(errors).toEqual([]);
  });

  test(`${url} explains its buttons instead of leaving the page`, async ({ page }) => {
    await page.goto(url);
    const toast = page.locator('.demo-toast');
    await page.locator('.wa-float').click();
    await expect(toast).toHaveClass(/show/);
    await expect(toast).toContainText('WhatsApp');
    const form = page.locator('form[data-demo-form]');
    for (const input of await form.locator('input[required]').all()) {
      const type = await input.getAttribute('type');
      await input.fill(type === 'email' ? 'reader@example.com' : type === 'tel' ? '0123456789' : 'Test');
    }
    await form.locator('button[type="submit"]').click();
    await expect(toast).toContainText('enquiry');
    expect(new URL(page.url()).pathname, 'still on the demo').toBe(`/${url}`);
  });

  test(`${url} reads in BM and 中文`, async ({ page, isMobile }) => {
    await page.goto(url);
    for (const [lang, htmlLang] of [['ms', 'ms'], ['zh', 'zh-CN']]) {
      await page.locator(`.demo-lang [data-lang="${lang}"]`).click();
      await expect(page.locator('html')).toHaveAttribute('lang', htmlLang);
      expect(await page.evaluate(() => [...window.demoLanguage.missing]), `${lang}: English text with no translation`).toEqual([]);
      for (const width of isMobile ? [null] : [320, 768, 1280]) {
        if (width) { await page.setViewportSize({ width, height: 800 }); await frame(page); }
        expect.soft(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${lang} at ${width ?? 'device'}: sideways overflow`).toBe(0);
        for (const tab of await page.locator('.demo-tabs a').all()) await expect.soft(tab, `${lang} at ${width ?? 'device'}: every tab can be seen`).toBeInViewport({ ratio: 1 });
      }
    }
    // The choice is remembered, and shared with the rest of the site and the brochure
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    expect(await page.evaluate(() => localStorage.getItem('jontech-lang'))).toBe('zh');
    await page.locator('.wa-float').click();
    await expect(page.locator('.demo-toast'), 'the explanations are translated too').toContainText('演示');
  });

  test(`${url} offers a way back when opened from the brochure, and only then`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator('.demo-back'), 'opened directly').toBeHidden();
    await page.goto('index.html'); // stands in for the brochure, whose link the demo never sees
    await page.goto(`${url}?from=brochure`);
    await expect(page.locator('.demo-back')).toBeVisible();
    expect(new URL(page.url()).search, 'the address is tidied up').toBe('');
    // The fullest bar: back button and the longest language. Every tab still fits.
    await page.locator('.demo-lang [data-lang="ms"]').click();
    for (const tab of await page.locator('.demo-tabs a').all()) await expect.soft(tab, 'BM with the back button: every tab can be seen').toBeInViewport({ ratio: 1 });
    // Switching demos adds nothing to the history, so Back still lands on the brochure
    const other = page.locator('.demo-tabs a:not([aria-current])').first();
    const href = await other.getAttribute('href');
    await other.click();
    await page.waitForURL(`**/demo/${href}`);
    await page.locator('.demo-back').click();
    await page.waitForURL(/\/index\.html$/);
  });

  // Same rules as a11y.spec.mjs
  test(`accessibility: ${url}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chrome', 'engine-independent');
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(violations.map(v => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length}× e.g. ${v.nodes[0].target.join(' ')}`)).toEqual([]);
  });
}
