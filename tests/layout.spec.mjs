// Every page, in both themes, lays out cleanly on this browser or device: nav on one line, nothing
// cut off at the screen edge, images and logo present, no script errors. Desktop browsers also sweep
// every width from a small phone to a large monitor.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PAGES, WIDTHS, open, frame, theme, layoutProblems, watchErrors } from './helpers.mjs';

const SHOTS = ['index.html', 'zh/services/pos-system.html', 'ms/contact.html'];

for (const url of PAGES) {
  test(`layout: ${url}`, async ({ page, isMobile, viewport }, info) => {
    test.setTimeout(120_000); // the long home page at 24 widths is slow in Firefox
    const errors = watchErrors(page);
    for (const scheme of ['light', 'dark']) {
      await open(page, url, scheme);
      expect.soft(await theme(page), `${scheme}: theme`).toBe(scheme);
      expect.soft(await layoutProblems(page), `${scheme} at ${viewport.width}px`).toEqual([]);
      if (SHOTS.includes(url)) {
        const dir = path.join(info.config.rootDir, 'test-results', 'shots');
        fs.mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: path.join(dir, `${info.project.name}-${url.replace(/[\/.]/g, '_')}-${scheme}.png`), scale: 'css' });
      }
    }
    if (!isMobile) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        await frame(page);
        expect.soft(await layoutProblems(page), `dark at ${width}px`).toEqual([]);
      }
    }
    expect.soft(errors, 'page errors').toEqual([]);
  });
}
