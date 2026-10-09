// Tells Bing (and the other IndexNow search engines: Yandex, Naver, Seznam) that every page in
// sitemap.xml is new or updated, so they recrawl it without waiting. Google doesn't use IndexNow —
// submit the sitemap in Google Search Console instead.
// Usage, after the site is deployed: node tools/indexnow.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'jontech-solutions.com';

// The key file at the site root proves to the search engines that we own the site
const keyFile = fs.readdirSync(ROOT).find(f => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('No IndexNow key file (<32 hex chars>.txt) at the site root');
const key = keyFile.slice(0, -4);

const live = await fetch(`https://${HOST}/${keyFile}`);
if (!live.ok || (await live.text()).trim() !== key) {
  throw new Error(`https://${HOST}/${keyFile} isn't live yet — deploy first, then rerun`);
}

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList }),
});
// 200 = received, 202 = received and key validation pending
console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URLs`);
if (!res.ok) { console.error(await res.text()); process.exit(1); }
