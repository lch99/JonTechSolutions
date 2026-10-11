// Shared by the spec files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The English source pages, and every page including the generated BM / 中文 copies
export const SRC_PAGES = ['index.html', 'contact.html', ...fs.readdirSync(path.join(ROOT, 'services')).filter(f => f.endsWith('.html')).map(f => `services/${f}`)];
export const PAGES = [...SRC_PAGES, ...['ms', 'zh'].flatMap(l => SRC_PAGES.map(p => `${l}/${p}`))];
export const WIDTHS = [320, 344, 360, 375, 390, 412, 430, 480, 540, 600, 601, 680, 681, 768, 820, 900, 1024, 1100, 1240, 1241, 1280, 1366, 1440, 1920];

export const frame = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

// Open a page as a visitor whose system is set to `scheme`, and wait for the web font
export async function open(page, url, scheme = 'light') {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await frame(page);
}

export const theme = page => page.evaluate(() => document.documentElement.dataset.theme);
export const savedTheme = page => page.evaluate(() => localStorage.getItem('jontech-theme'));
export const css = (page, selector, prop) => page.locator(selector).first().evaluate((el, p) => getComputedStyle(el)[p], prop);

// Use whichever theme control this screen size shows: the nav button, or the row in the menu
export async function toggleTheme(page) {
  const button = page.locator('.nav-links .theme-toggle');
  if (await button.isVisible()) return button.click();
  if (!(await page.locator('#mobileMenu').evaluate(m => m.classList.contains('open')))) await page.locator('#navToggle').click();
  await page.locator('.mobile-theme').click();
}

// Script errors, console errors and failed requests while the page is in use
export function watchErrors(page) {
  const errors = [];
  const ours = url => url.startsWith('http://127.0.0.1');
  page.on('pageerror', e => errors.push(`script error: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && ours(m.location().url || 'http://127.0.0.1')) errors.push(`console error: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400 && ours(r.url())) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  return errors;
}

// Layout problems on the current page at its current size. Runs in the browser.
export const layoutProblems = page => page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const r = e => e.getBoundingClientRect();
  const style = e => getComputedStyle(e);
  const vis = e => { const c = style(e); if (c.display === 'none' || c.visibility === 'hidden') return false; const b = r(e); return b.width > 0 && b.height > 0; };
  const name = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const problems = [];

  // Nav bar: one line, nothing overlapping, nothing off-screen
  const nav = document.getElementById('nav'), logo = nav.querySelector('.nav-logo'), links = nav.querySelector('.nav-links');
  const nb = r(nav), lb = r(logo), kb = r(links);
  if (Math.round(nb.height) !== 52) problems.push(`nav bar is ${Math.round(nb.height)}px tall, not 52`);
  if (lb.height > 36) problems.push('nav: site name wraps');
  for (const k of links.children) {
    if (!vis(k)) continue;
    const b = r(k);
    if (b.height > 44) problems.push(`nav: ${name(k)} wraps (${Math.round(b.height)}px tall)`);
    if (b.top < nb.top - 1 || b.bottom > nb.bottom + 1) problems.push(`nav: ${name(k)} sticks out of the bar`);
  }
  if (lb.right > kb.left + 0.5) problems.push('nav: site name overlaps the buttons');
  if (kb.right > vw + 0.5 || lb.left < -0.5) problems.push('nav: content runs off-screen');

  // Anything wider than the screen. html and body hide horizontal overflow, so it would be cut off.
  if (document.documentElement.scrollWidth > vw + 1) problems.push(`page is ${document.documentElement.scrollWidth}px wide in a ${vw}px screen`);
  const clipped = e => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) if (/hidden|clip|auto|scroll/.test(style(p).overflowX)) return true; return false; };
  const off = new Set();
  for (const e of document.body.querySelectorAll('*')) {
    if (off.has(e.parentElement)) { off.add(e); continue; }
    if (!vis(e)) continue;
    const b = r(e);
    if ((b.right > vw + 1 || b.left < -1) && !clipped(e)) { off.add(e); problems.push(`cut off at the screen edge: ${name(e)} (${Math.round(b.left)}…${Math.round(b.right)} of ${vw})`); }
  }

  for (const i of document.images) if (!i.complete || !i.naturalWidth) problems.push(`image did not load: ${i.getAttribute('src')}`);
  for (const m of document.querySelectorAll('.logo-mark')) {
    if (vis(m) && !new RegExp(`logo-mark-${document.documentElement.dataset.theme}\\.png`).test(style(m).backgroundImage)) problems.push('logo mark does not match the theme');
  }
  return problems;
});
