// Private pages (offers/*.html): locked without their link, and a normal page of the site with it.
// The keys are only on the computer that published the pages (private/keys.json); elsewhere the
// unlocked tests are skipped.
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { ROOT, WIDTHS, open, frame, theme, layoutProblems, watchErrors } from './helpers.mjs';

const dir = path.join(ROOT, 'offers');
const OFFERS = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.html')) : [];
const keysFile = path.join(ROOT, 'private/keys.json');
const KEYS = fs.existsSync(keysFile) ? JSON.parse(fs.readFileSync(keysFile, 'utf8')) : {};

for (const file of OFFERS) {
  const name = file.slice(0, -5);
  const url = `offers/${file}`;

  test(`${url} stays locked without its link`, async ({ page }) => {
    const errors = watchErrors(page);
    for (const hash of ['', '#AAAAAAAAAAAAAAAAAAAAAA', '#not-a-key!']) {
      await open(page, url + hash);
      await expect(page.locator('#offer-lock'), `with "${hash}"`).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.locator('body').innerText()).not.toMatch(/RM\s?\d/);
    }
    expect(errors).toEqual([]);
  });

  test(`${url} opens with its link`, async ({ page, isMobile, viewport }) => {
    test.skip(!KEYS[name], `no key for ${name} on this computer`);
    test.setTimeout(120_000);
    const errors = watchErrors(page);
    const link = `${url}#${KEYS[name]}`;
    for (const scheme of ['light', 'dark']) {
      await open(page, link, scheme);
      await expect(page.locator('#offer-lock')).toHaveCount(0);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await theme(page)).toBe(scheme);
      expect.soft(await layoutProblems(page), `${scheme} at ${viewport.width}px`).toEqual([]);
    }
    if (!isMobile) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        await frame(page);
        expect.soft(await layoutProblems(page), `dark at ${width}px`).toEqual([]);
      }
    }
    expect(errors).toEqual([]);
  });

  test(`${url}: links within the page keep the key, and the language switch works`, async ({ page }) => {
    test.skip(!KEYS[name], `no key for ${name} on this computer`);
    await open(page, `${url}#${KEYS[name]}`);
    const inPage = page.locator('main a[href^="#"]').first();
    if (await inPage.count()) {
      const target = page.locator(await inPage.getAttribute('href'));
      await inPage.click();
      await expect(target).toBeInViewport();
      expect(new URL(page.url()).hash).toBe(`#${KEYS[name]}`);
    }
    await page.evaluate(() => scrollTo(0, 0));
    const h1 = await page.locator('main h1').innerText();
    // On small screens the language switch is still in the bar
    await page.locator('.lang-switch a[data-lang="zh"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page.locator('main h1')).not.toHaveText(h1);
    await page.locator('.lang-switch a[data-lang="ms"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
    expect(new URL(page.url()).hash).toBe(`#${KEYS[name]}`);
    await page.reload();
    await expect(page.locator('main h1'), 'reopening keeps the page unlocked and in the chosen language').toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
  });

  test(`${url} saves as a one-page A4 PDF in every language`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chrome', 'only Chrome can save a PDF here');
    test.skip(!KEYS[name], `no key for ${name} on this computer`);
    await open(page, `${url}#${KEYS[name]}`);
    await expect(page.locator('main h1')).toBeVisible();
    for (const lang of ['en', 'ms', 'zh']) {
      await page.locator(`.lang-switch a[data-lang="${lang}"]`).click();
      await expect(page.locator('html')).toHaveAttribute('lang', { en: 'en', ms: 'ms', zh: 'zh-CN' }[lang]);
      // The print stylesheet lets an overlong brochure spill onto a second page, so a count of 1 means it all fits
      const pdf = (await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString('latin1');
      expect((pdf.match(/\/Type\s*\/Page(?![s\w])/g) || []).length, `${lang}: pages`).toBe(1);
    }
  });

  // Same rules as a11y.spec.mjs, on the locked page and the unlocked one
  for (const scheme of ['light', 'dark']) {
    test(`accessibility: ${url} (${scheme})`, async ({ page }, info) => {
      test.skip(info.project.name !== 'chrome', 'engine-independent');
      for (const hash of ['', KEYS[name] && `#${KEYS[name]}`].filter(h => h !== undefined)) {
        await open(page, url + hash, scheme);
        await page.locator(hash ? 'main h1' : '#offer-lock h1').waitFor();
        await page.addStyleTag({ content: '.reveal{opacity:1!important;animation:none!important}' });
        const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(violations.map(v => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length}× e.g. ${v.nodes[0].target.join(' ')}`), hash ? 'unlocked' : 'locked').toEqual([]);
      }
    });
  }
}
