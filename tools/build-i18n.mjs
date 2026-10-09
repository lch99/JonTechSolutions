// Builds ms/index.html and zh/index.html from index.html so search engines can index the
// Malay and Chinese versions (the main page only translates itself in the browser).
// Usage: node tools/build-i18n.mjs           rebuild (no dependencies; rerun after editing index.html)
//        node tools/build-i18n.mjs --check   exit 1 if the committed pages are out of date
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://jontech-solutions.com';

const LANGS = {
  ms: {
    htmlLang: 'ms',
    ogLocale: 'ms_MY',
    description: 'Studio automasi dan AI di Malaysia — sistem tersuai, POS, kiosk, platform web dan AI praktikal untuk PKS. Cuba semakan UI/UX AI percuma untuk laman web anda.',
  },
  zh: {
    htmlLang: 'zh-CN',
    ogLocale: 'zh_CN',
    description: '立足马来西亚的自动化与 AI 工作室——为中小企业打造定制系统、POS、自助服务机、网站平台与实用 AI。免费试用我们的 AI 网站 UI/UX 检测。',
  },
};

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function between(s, start, end) {
  const i = s.indexOf(start);
  const j = s.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error(`Could not find "${start}" … "${end}" in index.html`);
  return s.slice(i, j);
}

// The translations live in the page's inline script; evaluate just those declarations.
const { zhText, msText, TITLES } = vm.runInNewContext(
  between(src, 'const zhText = {', 'const TEXTS =') +
  between(src, 'const TITLES = {', 'const HTML_LANG') +
  ';({ zhText, msText, TITLES })'
);
const TEXTS = { zh: zhText, ms: msText };

const escAttr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };
const toPlainText = s => s.replace(/<[^>]*>/g, ' ')
  .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (all, e) => ENTITIES[e])
  .replace(/\s+/g, ' ').trim();
// An opening tag, allowing ">" inside quoted attribute values
const OPEN_TAG = /<[a-zA-Z][^>"']*(?:"[^"]*"[^>"']*|'[^']*'[^>"']*)*>/y;
const OPEN_TAG_G = new RegExp(OPEN_TAG.source, 'g');
function openTagAt(html, start) {
  OPEN_TAG.lastIndex = start;
  const m = OPEN_TAG.exec(html);
  if (!m) throw new Error(`Malformed tag at offset ${start}`);
  return m[0];
}

// Replace exactly one match, so a changed head tag fails loudly instead of silently shipping English.
function replaceOne(s, re, replacement) {
  const n = (s.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || []).length;
  if (n !== 1) throw new Error(`Expected one match for ${re}, found ${n}`);
  return s.replace(re, replacement);
}

// Swap the inner HTML of every [data-i18n] element that has a translation. Empty or missing
// translations keep the English, as setLanguage() does in the browser.
function translateBody(html, dict) {
  const re = /\sdata-i18n="([^"]+)"/g;
  const hits = [];
  let m;
  while ((m = re.exec(html))) {
    const tagStart = html.lastIndexOf('<', m.index);
    const tag = openTagAt(html, tagStart);
    if (tagStart + tag.length < m.index) throw new Error(`Could not find the tag for data-i18n="${m[1]}"`);
    const name = /^<([a-zA-Z][a-zA-Z0-9]*)/.exec(tag)[1];
    const contentStart = tagStart + tag.length;
    const open = new RegExp(`<${name}[\\s>]|</${name}>`, 'gi');
    open.lastIndex = contentStart;
    let depth = 1, t;
    while (depth && (t = open.exec(html))) depth += t[0][1] === '/' ? -1 : 1;
    if (depth) throw new Error(`Unclosed <${name} data-i18n="${m[1]}">`);
    hits.push({ key: m[1], start: contentStart, end: t.index });
  }
  for (const h of hits) {
    if (hits.some(o => o !== h && o.start < h.start && h.end < o.end)) throw new Error(`Nested data-i18n "${h.key}" is not supported`);
  }
  for (const h of hits.reverse()) {
    if (dict[h.key]) html = html.slice(0, h.start) + dict[h.key] + html.slice(h.end);
  }
  return html.replace(OPEN_TAG_G, tag => {
    const key = /\sdata-i18n-ph="([^"]+)"/.exec(tag);
    if (!key || !dict[key[1]]) return tag;
    if (!/\splaceholder="/.test(tag)) throw new Error(`data-i18n-ph="${key[1]}" has no placeholder attribute`);
    return tag.replace(/(\splaceholder=")[^"]*"/, `$1${escAttr(dict[key[1]])}"`);
  });
}

// The generated pages live one folder down, so relative links need a "../".
function rebaseLinks(html) {
  return html.replace(/(\s(?:href|src)=")([^"]*)"/g, (all, attr, url) => {
    if (!url || /^(#|\/|[a-z][a-z0-9+.-]*:)/i.test(url)) return all;
    return `${attr}${url === './' ? '../' : '../' + url}"`;
  });
}

function build(lang) {
  const cfg = LANGS[lang];
  const dict = TEXTS[lang];
  const url = `${SITE}/${lang}/`;
  const title = TITLES[lang];
  const ogDesc = toPlainText(dict.heroSub);

  // Keep inline scripts (JSON-LD and the page script) out of the HTML rewriting.
  const scripts = [];
  let html = src.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g, (all, a, body, c) => {
    scripts.push(body);
    return `${a}\u0000${scripts.length - 1}\u0000${c}`;
  });

  html = replaceOne(html, /<html lang="en">/, `<html lang="${cfg.htmlLang}" data-page-lang="${lang}">`);
  html = replaceOne(html, /<!DOCTYPE html>(\r?\n)/, `$&<!-- Generated from index.html by tools/build-i18n.mjs — edit index.html and rerun, don't edit this file. -->$1`);
  html = replaceOne(html, /<title>[^<]*<\/title>/, `<title>${escText(title)}</title>`);
  html = replaceOne(html, /(<meta name="description" content=")[^"]*"/, `$1${escAttr(cfg.description)}"`);
  html = replaceOne(html, /(<link rel="canonical" href=")[^"]*"/, `$1${url}"`);
  html = replaceOne(html, /(<meta property="og:url" content=")[^"]*"/, `$1${url}"`);
  html = replaceOne(html, /(<meta property="og:locale" content=")[^"]*"/, `$1${cfg.ogLocale}"`);
  html = replaceOne(html, /(<meta property="og:title" content=")[^"]*"/, `$1${escAttr(title)}"`);
  html = replaceOne(html, /(<meta property="og:description" content=")[^"]*"/, `$1${escAttr(ogDesc)}"`);
  html = replaceOne(html, /(<meta name="twitter:title" content=")[^"]*"/, `$1${escAttr(title)}"`);
  html = replaceOne(html, /(<meta name="twitter:description" content=")[^"]*"/, `$1${escAttr(ogDesc)}"`);
  html = translateBody(html, dict);
  html = rebaseLinks(html);
  let switchLinks = 0;
  html = html.replace(OPEN_TAG_G, tag => {
    const l = /^<a\s[^>]*\sdata-lang="(\w+)"/.exec(tag);
    if (!l) return tag;
    switchLinks++;
    tag = tag.replace(/\sclass="active"|\saria-current="true"/g, '');
    return l[1] === lang ? tag.replace(/\/?>$/, ' class="active" aria-current="true"$&') : tag;
  });
  if (switchLinks !== Object.keys(LANGS).length + 1) throw new Error(`Expected ${Object.keys(LANGS).length + 1} language links, found ${switchLinks}`);

  return html.replace(/\u0000(\d+)\u0000/g, (all, i) => scripts[i]);
}

// --check: fail if the committed pages are out of date with index.html (nothing is written)
const check = process.argv.includes('--check');
let stale = false;
for (const lang of Object.keys(LANGS)) {
  const out = path.join(ROOT, lang, 'index.html');
  const html = build(lang);
  const rel = path.relative(ROOT, out);
  if (check) {
    const current = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
    if (current !== html) { stale = true; console.error(`${rel} is out of date — run node tools/build-i18n.mjs`); }
  } else {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
    console.log(`wrote ${rel}`);
  }
}
if (stale) process.exit(1);
