// What a visitor can do on the site: menus, language, projects, FAQ, the chat, the UX check, the forms.
import { test, expect } from '@playwright/test';
import { open, theme, css, watchErrors } from './helpers.mjs';

test('desktop shows the page links; smaller screens show the menu button', async ({ page, viewport }) => {
  await open(page, 'index.html');
  const desktop = viewport.width > 1240;
  await expect(page.locator('.nav-links > a[data-i18n="navServices"]')).toBeVisible({ visible: desktop });
  await expect(page.locator('#navToggle')).toBeVisible({ visible: !desktop });
  await expect(page.locator('.nav-links .theme-toggle')).toBeVisible({ visible: viewport.width > 680 });
  await expect(page.locator('.nav-logo .logo-mark')).toBeVisible({ visible: viewport.width > 680 });
});

test('the menu opens, holds every link, and closes after picking one', async ({ page, viewport }) => {
  test.skip(viewport.width > 1240, 'desktop has no menu button');
  await open(page, 'index.html', 'dark');
  const menu = page.locator('#mobileMenu');
  await expect(menu, 'closed menu is out of reach of keyboard and screen readers').toHaveCSS('visibility', 'hidden');

  await page.locator('#navToggle').click();
  await expect(menu).toHaveClass(/open/);
  await expect(page.locator('#navToggle')).toHaveAttribute('aria-expanded', 'true');
  for (const link of await menu.locator('a').all()) await expect(link).toBeInViewport();
  await expect(page.locator('.mobile-theme'), 'Theme row shows where the nav button does not').toBeVisible({ visible: viewport.width <= 680 });
  if (viewport.width <= 680) {
    await expect(page.locator('.mobile-theme')).toBeInViewport();
    await page.locator('.mobile-theme').click();
    expect(await theme(page)).toBe('light');
    await expect(menu, 'menu stays open after switching theme').toHaveClass(/open/);
  }

  await menu.locator('a[href="#services"]').click();
  await expect(menu).not.toHaveClass(/open/);
  await expect(menu).toHaveCSS('visibility', 'hidden');
});

test('language switch translates the English page in place and remembers it', async ({ page }) => {
  await open(page, 'index.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('.lang-switch a[data-lang="ms"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
  await expect(page.locator('#mobileMenu a[data-i18n="navServices"]')).toHaveText('Perkhidmatan');
  await expect(page.locator('.mobile-theme [data-i18n="navTheme"]')).toHaveText('Tema');
  expect(new URL(page.url()).pathname).toBe('/index.html');

  await page.locator('.lang-switch a[data-lang="zh"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('.theme-toggle [data-i18n="navTheme"]')).toHaveText('主题');
  await page.reload();
  await expect(page.locator('html'), 'after a reload').toHaveAttribute('lang', 'zh-CN');
});

test('the generated BM and 中文 pages are translated and link back to English', async ({ page }) => {
  await open(page, 'ms/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
  await expect(page.locator('h1')).not.toContainText('Stop doing');
  await open(page, 'zh/services/pos-system.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.locator('.lang-switch a[data-lang="en"]').click();
  await expect(page).toHaveURL(/\/services\/pos-system\.html$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('project filters narrow the list and "All" restores it', async ({ page }) => {
  await open(page, 'index.html', 'dark');
  const shownProjects = () => page.locator('.proj:not(.is-hidden)').count();
  const total = await shownProjects();
  await page.locator('.proj-filter[data-filter="ai"]').click();
  await expect(page.locator('.proj-filter[data-filter="ai"]')).toHaveClass(/active/);
  const some = await shownProjects();
  expect(some).toBeGreaterThan(0);
  expect(some).toBeLessThan(total);
  await expect.poll(() => css(page, '.proj-filter.active', 'backgroundColor'), 'active pill inverts in dark').toBe('rgb(245, 245, 247)');
  await page.locator('.proj-filter[data-filter="all"]').click();
  expect(await shownProjects()).toBe(total);
});

test('FAQ answers open on click', async ({ page }) => {
  await open(page, 'services/pos-system.html');
  const first = page.locator('.faq-item').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('p')).toBeVisible();
});

for (const scheme of ['light', 'dark']) {
  test(`Ask AI chat opens, answers and closes (${scheme})`, async ({ page, viewport }) => {
    const errors = watchErrors(page);
    await open(page, 'index.html', scheme);
    await page.locator('.jt-fab').click();
    const panel = page.locator('.jt-panel');
    await expect(panel).toHaveClass(/open/);
    await expect(panel).toHaveCSS('background-color', scheme === 'dark' ? 'rgb(40, 40, 45)' : 'rgb(255, 255, 255)');

    await panel.locator('.jt-form input').fill('How much does a POS system cost?');
    await panel.locator('.jt-form input').press('Enter');
    await expect(panel.locator('.jt-msg.user')).toHaveCount(1);
    await expect(panel.locator('.jt-msg.bot:not(.jt-typing)'), 'greeting plus an answer').toHaveCount(2);

    const box = await panel.boundingBox();
    expect(box.x, 'panel fits the screen').toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(await css(page, '.jt-form input', 'color'), 'typed text is visible').not.toBe(await css(page, '.jt-form input', 'backgroundColor'));

    await panel.locator('.jt-head button.jt-icon-btn').click();
    await expect(panel).not.toHaveClass(/open/);
    expect(errors).toEqual([]);
  });
}

test('free UX check asks for an address, then hands over to WhatsApp', async ({ page }) => {
  await open(page, 'index.html', 'dark');
  await page.locator('#uxBtn').click();
  await expect(page.locator('#uxMsg')).toBeVisible();
  await page.locator('#uxUrl').fill('example-shop.my');
  await page.locator('#uxBtn').click();
  await expect(page.locator('#uxMsg a')).toHaveAttribute('href', /^https:\/\/wa\.me\/60195023897\?text=/);
});

test('contact form needs a name, email and message, and fields follow the theme', async ({ page }) => {
  await open(page, 'contact.html', 'dark');
  const form = page.locator('.contact-form');
  expect(await form.evaluate(f => f.checkValidity())).toBe(false);
  await expect(form.locator('input').first()).toHaveCSS('background-color', 'rgb(40, 40, 45)');
  await expect(page.locator('#service')).toHaveCSS('background-color', 'rgb(40, 40, 45)');
  await expect(form.locator('input').first()).toHaveCSS('color', 'rgb(245, 245, 247)');
});

test('sending a contact form reaches someone', async ({ page, context }) => {
  // never contact the real WhatsApp from a test
  await context.route('https://wa.me/**', route => route.fulfill({ contentType: 'text/html', body: '<title>wa</title>' }));
  for (const url of ['contact.html', 'services/pos-system.html']) {
    await open(page, url);
    const form = page.locator('.contact-form');
    const action = await form.getAttribute('action');
    if (!action.includes('REPLACE-WITH')) { expect(action, url).toMatch(/^https:\/\/formspree\.io\/f\/[a-z0-9]+$/i); continue; }

    // no form address set up yet: the message is handed to WhatsApp instead
    await form.locator('[name="name"]').fill('Aina Tan');
    await form.locator('[name="email"]').fill('aina@example.com');
    await form.locator('[name="message"]').fill('We need a POS for two outlets.');
    const [popup] = await Promise.all([context.waitForEvent('page'), form.locator('button[type="submit"]').click()]);
    const sent = decodeURIComponent(new URL(popup.url()).searchParams.get('text'));
    expect(popup.url(), url).toMatch(/^https:\/\/wa\.me\/60195023897\?text=/);
    expect(sent).toContain('Aina Tan');
    expect(sent).toContain('aina@example.com');
    expect(sent).toContain('We need a POS for two outlets.');
    await expect(form.locator('.form-success')).toBeVisible();
    expect(new URL(page.url()).pathname, 'the visitor stays on the page').toContain(url);
    await popup.close();
  }
});
