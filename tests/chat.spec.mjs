// The chat's built-in answers (used while no live AI endpoint is set): the right topic for a question,
// in the language it was asked in, with follow-up buttons. Text matching is the same in every
// browser, so the question table runs in Chrome only.
import { test, expect } from '@playwright/test';
import { open } from './helpers.mjs';

// [question, a phrase the reply must contain]
const CASES = [
  ['hi', 'What are you trying to fix or build'],
  ['thanks!', "You're welcome"],
  ['who are you', 'website assistant'],
  ['are you a real person?', 'website assistant'],
  ['what services do you offer', 'removes manual work'],
  ['what projects have you done', 'Recent work'],
  ['How much does it cost?', 'no fixed price list'],
  ['how much for a POS system', 'number of tills'],
  ['How long does it take to build a POS?', '3–6 weeks'],
  ['how long for a website', '4–8 weeks'],
  ['how much does an app cost', 'platform coverage'],
  ['how much does custom software cost', 'fixed quote after a free scoping call'],
  ['is AI expensive', 'far cheaper than hiring additional staff'],
  ['What kind of kiosks have you built?', 'scalp spa'],
  ['Can you sync my stock with Shopee and Lazada?', 'TikTok Shop'],
  ['How could AI help a small retail shop?', 'genuinely saves work'],
  ['can you build an AI assistant for my business', 'one client at a time'],
  ['will AI replace my staff', 'not to replace'],
  ['what if the ai gets it wrong', 'human review'],
  ['do you do face recognition', "haven't done face recognition"],
  ['do I own the source code', 'full source code ownership'],
  ['should I get custom or off-the-shelf software', 'SaaS is cheaper'],
  ['is there support after launch', 'ongoing maintenance'],
  ['can you take over our existing system', 'review and extend existing systems'],
  ['do you handle hosting', 'CI/CD and deployment'],
  ['what tech stack do you use', 'React, Node.js and MySQL'],
  ['how do you work', 'Four steps'],
  ['is the consultation free', 'first scoping call is free'],
  ['how fast do you reply', 'within 24 hours'],
  ['how can I contact you', 'WhatsApp is fastest'],
  ['where are you located', 'based in Malaysia'],
  ['do you speak chinese', 'English, Bahasa Malaysia and Chinese'],
  ['can it work offline', 'offline-first'],
  ['LHDN e-invoice?', 'LHDN e-invoice compliance'],
  ['do you support DuitNow payment', 'DuitNow QR'],
  ['does it work with a barcode scanner', 'barcode scanners'],
  ['do you build mobile apps for android', 'React Native'],
  ['can you build a booking system for my salon', 'booking systems are one of the things we build'],
  ['can you connect my accounting to my shop system with an API', 'data flows automatically'],
  ['I want a sales dashboard', 'live dashboards'],
  ['do you do QA testing', 'QA is our background'],
  ['what can be automated in my office', 'core work'],
  ['what is the free ux check', 'free AI UI/UX check'],
  ['do you work with restaurants', 'Projects so far cover'],
  ['are you ok for a small business', 'startups and small businesses are exactly'],
  ['who is behind this company', 'one-person studio'],
  ['can you build something for me', 'Quite possibly'],
  ['why should I choose you', 'Process first'],
  ['do you have a demo', 'live demo'],
  ['how do I start', 'Four steps'],
  ['ok', 'Got it'],
  // the way people actually describe a problem
  ['I run a cafe and need a system to take orders', 'custom POS systems'],
  ['my staff key in sales by hand into excel every night', 'core work'],
  ['do you do websites for small shops?', 'modern web apps'],
  ['can AI answer my customers on whatsapp', 'one client at a time'],
  // things the site doesn't cover: say so plainly, never invent
  ['is my data safe', 'your data stays in your own system'],
  ['do you offer discount', "don't have details on payment terms"],
  ['do you fix laptops', "aren't among them"],
  // typos
  ['pricng?', 'no fixed price list'],
  ['automtion of data entry', 'core work'],
  // nothing prepared: says so instead of guessing
  ['what is the weather today', "don't have a prepared answer"],
  // Bahasa Malaysia asked on the English page → answered in Bahasa Malaysia
  ['berapa harga sistem POS', 'Harga POS tersuai'],
  ['berapa lama untuk siap laman web', '4–8 minggu'],
  ['boleh guna tanpa internet?', 'luar talian'],
  ['apa perkhidmatan yang anda tawarkan', 'Kami membina perisian'],
  ['terima kasih', 'Sama-sama'],
  // 中文 asked on the English page → answered in 中文
  ['POS系统多少钱', '收银台数量'],
  ['AI能怎样帮助我的业务？', '真正省力'],
  ['你们在哪里', '立足马来西亚'],
  ['做一个网站要多久', '4–8 周'],
  ['支持电子发票吗', 'LHDN 电子发票合规'],
  ['你们能做餐厅点餐系统吗', '定制 POS'],
  ['我想做一个小程序', '很可能可以'],
  ['谢谢', '不客气'],
];

test('built-in answers pick the right topic, in the language asked', async ({ page }, info) => {
  test.skip(info.project.name !== 'chrome', 'engine-independent');
  await open(page, 'index.html');
  await page.waitForFunction(() => window.JonTechAI);
  for (const [question, phrase] of CASES) {
    // "thanks" first, so one case can't lend context to the next
    const reply = await page.evaluate(q => { window.JonTechAI.answer('thanks'); return window.JonTechAI.answer(q).text; }, question);
    expect.soft(reply, question).toContain(phrase);
  }
});

test('a bare "how much?" or "how long?" follows on from the last topic', async ({ page }, info) => {
  test.skip(info.project.name !== 'chrome', 'engine-independent');
  await open(page, 'index.html');
  await page.waitForFunction(() => window.JonTechAI);
  const ask = q => page.evaluate(x => window.JonTechAI.answer(x).text, q);
  expect(await ask('tell me about your POS systems')).toContain('custom POS systems');
  expect(await ask('how much?')).toContain('number of tills');
  expect(await ask('and how long?')).toContain('3–6 weeks');
  expect(await ask('how much is a mobile app', 'a named product beats the context')).toContain('platform coverage');
});

test('every follow-up button leads to a real topic with a reply in each language', async ({ page }, info) => {
  test.skip(info.project.name !== 'chrome', 'engine-independent');
  await open(page, 'index.html');
  await page.waitForFunction(() => window.JonTechAI);
  const seen = await page.evaluate(() => {
    const out = [];
    const queue = [window.JonTechAI.answer('hi'), window.JonTechAI.answer('what is the weather')];
    const done = new Set();
    while (queue.length) {
      for (const id of queue.shift().next) {
        if (done.has(id)) continue;
        done.add(id);
        for (const l of ['en', 'ms', 'zh']) {
          const a = window.JonTechAI.answer('', id, l);
          out.push({ id, l, ok: typeof a.text === 'string' && a.text.length > 20 && a.next.length <= 3 });
          if (l === 'en') queue.push(a);
        }
      }
    }
    return out;
  });
  expect(seen.length).toBeGreaterThan(60);
  expect(seen.filter(s => !s.ok)).toEqual([]);
});

test('answers come with follow-up buttons that work', async ({ page }) => {
  await open(page, 'index.html', 'dark');
  await page.locator('.jt-fab').click();
  const panel = page.locator('.jt-panel');
  await expect(panel.locator('.jt-suggest button')).toHaveCount(3);
  await panel.locator('.jt-suggest button', { hasText: 'How much does it cost?' }).click();
  await expect(panel.locator('.jt-msg.bot').last()).toContainText('no fixed price list');
  await expect(panel.locator('.jt-suggest button')).toHaveCount(3);

  await panel.locator('.jt-suggest button', { hasText: 'How long does it take?' }).click();
  await expect(panel.locator('.jt-msg.bot').last()).toContainText('3–6 weeks');
  await expect(panel.locator('.jt-suggest button').first()).toBeInViewport();

  await panel.locator('.jt-form input').fill('你们做手机应用吗');
  await panel.locator('.jt-form input').press('Enter');
  await expect(panel.locator('.jt-msg.bot').last()).toContainText('React Native');
  await expect(panel.locator('.jt-suggest button').first(), 'buttons follow the reply language').toHaveText('手机应用多少钱？');
});
