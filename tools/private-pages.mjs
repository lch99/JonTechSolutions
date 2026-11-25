// Publishes the private pages: encrypts each private/<name>.html, which stays on this computer and is
// never committed, into offers/<name>.html, which is safe to commit to this public repo. Only someone
// with the page's link can read it. The key is the part of the link after "#", which browsers never
// send to a server, so GitHub, search engines and anyone reading the repo only get the locked page.
//
// What is encrypted: everything inside <main id="offer"> and the page's translations
// (<script id="i18n-data">). The <head> (title, description, link preview), nav and footer stay
// readable, so keep prices and anything else private inside <main>. A price (RM…) found outside it
// stops the build.
//
// Usage: node tools/private-pages.mjs                   encrypt every private/*.html and print its link
//        node tools/private-pages.mjs --check           exit 1 if an offers/ page is out of date
//        node tools/private-pages.mjs --recover <link>  rebuild private/<name>.html from its live link
//
// The keys are in private/keys.json. Keep each link somewhere safe too, such as a password manager:
// with it, --recover brings the source back if this folder is lost. A page that loses its key needs a
// new one, and the old link stops working.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'private');
const OUT = path.join(ROOT, 'offers');
const KEYS = path.join(SRC, 'keys.json');
const SITE = 'https://jontech-solutions.com';

// The <main> tags must each start a line, so a mention of them in a comment can't match
const MAIN = /^(<main id="offer"[^>]*>)([\s\S]*)^(<\/main>)/m;
const I18N = /<script id="i18n-data">([\s\S]*?)<\/script>\s*<script src="\.\.\/assets\/i18n\.js"><\/script>/;
const PAYLOAD = /<script type="application\/octet-stream" id="offer-data">([\s\S]*?)<\/script>/;
const PRICE = /RM\s?\d/;

// What the page shows until it is unlocked: in all three languages, as the translations are encrypted
const LOCK = `
<section class="offer-lock" id="offer-lock">
  <div class="offer-lock-icon" aria-hidden="true">🔒</div>
  <h1>This page is private</h1>
  <p>Open it with the full link JonTech Solutions sent you.</p>
  <p lang="ms">Halaman ini peribadi. Buka dengan pautan penuh yang dihantar oleh JonTech Solutions.</p>
  <p lang="zh-CN">这是私人页面，请使用 JonTech Solutions 发给您的完整链接打开。</p>
  <a href="https://wa.me/60195023897" target="_blank" rel="noopener noreferrer" class="btn-main"><svg class="icon" fill="currentColor"><use href="#icon-whatsapp"/></svg>WhatsApp us</a>
</section>
`;

const read = f => fs.readFileSync(f, 'utf8');
const loadKeys = () => (fs.existsSync(KEYS) ? JSON.parse(read(KEYS)) : {});
const saveKeys = keys => fs.writeFileSync(KEYS, JSON.stringify(keys, null, 2) + '\n', { mode: 0o600 });
const link = (name, key) => `${SITE}/offers/${name}.html#${key}`;

function encrypt(source, key, name) {
  const where = `private/${name}.html`;
  const main = MAIN.exec(source);
  const i18n = I18N.exec(source);
  if (!main) throw new Error(`${where}: no <main id="offer"> … </main>, each at the start of a line`);
  if (!i18n) throw new Error(`${where}: no <script id="i18n-data"> followed by <script src="../assets/i18n.js">`);

  const { zhText, msText, TITLES } = vm.runInNewContext(`${i18n[1]};({ zhText, msText, TITLES })`);
  const plain = Buffer.from(JSON.stringify({ main: main[2], i18n: { zhText, msText, TITLES } }));
  // The nonce is derived from the content, so an unchanged page encrypts to the same bytes (no churn in
  // git, and --check can compare), while any change gets a different nonce.
  const iv = crypto.createHmac('sha256', key).update(plain).digest().subarray(0, 12);
  const cipher = crypto.createCipheriv('aes-128-gcm', key, iv);
  const sealed = Buffer.concat([iv, cipher.update(plain), cipher.final(), cipher.getAuthTag()]).toString('base64').replace(/.{1,100}/g, '$&\n');

  const page = source
    .replace(MAIN, (_, open, __, close) => open + LOCK + close)
    .replace(I18N, () => `<script type="application/octet-stream" id="offer-data">\n${sealed}</script>`);
  const readable = page.replace(PAYLOAD, '');
  if (PRICE.test(readable)) throw new Error(`${where}: a price (RM…) is outside <main>, where anyone could read it`);
  // What must survive around the encrypted part
  for (const [what, re] of [['the noindex robots tag', /<meta name="robots" content="noindex/], ['the nav', /<nav id="nav">/], ['the footer', /<footer>/],
    ['theme.js in <head>', /<script src="\.\.\/assets\/theme\.js"><\/script>[\s\S]*<\/head>/], ['offer.js after the encrypted part', /id="offer-data">[\s\S]*<script src="\.\.\/assets\/offer\.js">/]]) {
    if (!re.test(page)) throw new Error(`${where}: the published page would be missing ${what}`);
  }
  return page;
}

function recover(url) {
  const { pathname, hash } = new URL(url);
  const name = path.basename(pathname, '.html');
  const key = Buffer.from(hash.slice(1), 'base64url');
  const target = path.join(SRC, `${name}.html`);
  if (fs.existsSync(target)) throw new Error(`private/${name}.html already exists; move it away first`);
  const page = read(path.join(OUT, `${name}.html`));
  const sealed = Buffer.from(PAYLOAD.exec(page)[1], 'base64');
  const decipher = crypto.createDecipheriv('aes-128-gcm', key, sealed.subarray(0, 12));
  decipher.setAuthTag(sealed.subarray(-16));
  let plain;
  try { plain = Buffer.concat([decipher.update(sealed.subarray(12, -16)), decipher.final()]); } catch {
    throw new Error(`that link does not open offers/${name}.html; check it is complete`);
  }
  const { main, i18n } = JSON.parse(plain);
  const js = Object.entries(i18n).map(([k, v]) => `const ${k} = ${JSON.stringify(v, null, 2)};`).join('\n\n');
  const source = page
    .replace(MAIN, (_, open, __, close) => open + main + close)
    .replace(PAYLOAD, () => `<script id="i18n-data">\n${js}\n</script>\n<script src="../assets/i18n.js"></script>`);
  fs.mkdirSync(SRC, { recursive: true });
  fs.writeFileSync(target, source);
  saveKeys({ ...loadKeys(), [name]: key.toString('base64url') });
  console.log(`Recovered private/${name}.html and its key`);
}

// Refuse to work unless git ignores the sources and keys, so they can't be committed by accident
try { execFileSync('git', ['check-ignore', '-q', 'private/keys.json'], { cwd: ROOT }); } catch {
  console.error('private/ is not in .gitignore; add "/private/" there first');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args[0] === '--recover') {
  if (!args[1]) { console.error('Usage: node tools/private-pages.mjs --recover <link>'); process.exit(1); }
  recover(args[1]);
  process.exit(0);
}

const check = args.includes('--check');
const keys = loadKeys();
const sources = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter(f => f.endsWith('.html')).sort() : [];
const stale = [];
fs.mkdirSync(OUT, { recursive: true });
for (const file of sources) {
  const name = file.slice(0, -5);
  if (!keys[name]) {
    if (check) { stale.push(`private/${file} has never been published`); continue; }
    keys[name] = crypto.randomBytes(16).toString('base64url');
    saveKeys(keys);
  }
  const page = encrypt(read(path.join(SRC, file)), Buffer.from(keys[name], 'base64url'), name);
  const out = path.join(OUT, file);
  if (check) {
    if (!fs.existsSync(out) || read(out) !== page) stale.push(`offers/${file} is out of date; run node tools/private-pages.mjs`);
    continue;
  }
  fs.writeFileSync(out, page);
  console.log(`offers/${file}\n  ${link(name, keys[name])}`);
}
if (check) {
  for (const s of stale) console.error(s);
  process.exit(stale.length ? 1 : 0);
}
for (const file of fs.readdirSync(OUT).filter(f => f.endsWith('.html') && !sources.includes(f))) {
  console.log(`offers/${file} has no source in private/, so it was left as it is`);
}
if (!sources.length) console.log('Nothing to publish: put a page in private/ first (see the header of this file)');
