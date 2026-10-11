// Accessibility scan (axe-core, WCAG 2 A and AA) of one page of each kind, in both themes.
// The rules are the same in every browser, so this runs in Chrome only.
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { open } from './helpers.mjs';

for (const url of ['index.html', 'contact.html', 'services/pos-system.html']) {
  for (const scheme of ['light', 'dark']) {
    test(`accessibility: ${url} (${scheme})`, async ({ page }, info) => {
      test.skip(info.project.name !== 'chrome', 'engine-independent');
      await open(page, url, scheme);
      // Sections fade in as they scroll into view; show them all so every one is checked
      await page.addStyleTag({ content: '.reveal{opacity:1!important;animation:none!important}.hero *{animation:none!important}' });
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const summary = violations.map(v => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length}× e.g. ${v.nodes[0].target.join(' ')}`);
      await info.attach('violations', { body: JSON.stringify(violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target.join(' '), summary: n.failureSummary })) })), null, 1), contentType: 'application/json' });
      expect(summary).toEqual([]);
    });
  }
}
