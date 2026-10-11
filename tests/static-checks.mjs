// Checks the site's files without a browser: links, translations, SEO tags, the stylesheet, scripts.
// Usage: node static-checks.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = [];
const todo = [];
const check = (name, problems, info = '') => results.push({ name, problems, info });
const rel = f => path.relative(ROOT, f).replace(/\\/g, '/');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const SRC_PAGES = ['index.html', 'contact.html', ...fs.readdirSync(path.join(ROOT, 'services')).filter(f => f.endsWith('.html')).map(f => `services/${f}`)];
const PAGES = [...SRC_PAGES, ...['ms', 'zh'].flatMap(l => SRC_PAGES.map(p => `${l}/${p}`))];
const html = Object.fromEntries(PAGES.map(p => [p, read(p)]));
const stripScripts = s => s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, m => m.replace(/>[\s\S]*</, '><'));
const ids = s => [...stripScripts(s).matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);

// 1. Every page exists and has the basics
{
  const bad = [];
  for (const p of PAGES) {
    const s = html[p];
    const title = (/<title>([^<]*)<\/title>/.exec(s)?.[1] ?? '').replace(/&amp;/g, '&');
    const desc = /<meta name="description" content="([^"]*)"/.exec(s)?.[1] ?? '';
    if (!/^<!DOCTYPE html>/i.test(s)) bad.push(`${p}: no doctype`);
    if (!/<html lang="[^"]+"/.test(s)) bad.push(`${p}: no <html lang>`);
    if (!/<meta name="viewport" content="width=device-width, initial-scale=1\.0"\/>/.test(s)) bad.push(`${p}: viewport meta missing`);
    if (title.length < 15 || title.length > 75) bad.push(`${p}: title length ${title.length} ("${title}")`);
    if (desc.length < (p.startsWith('zh/') ? 30 : 50) || desc.length > 200) bad.push(`${p}: description length ${desc.length}`);
    if ((s.match(/<h1[\s>]/g) || []).length !== 1) bad.push(`${p}: ${(s.match(/<h1[\s>]/g) || []).length} <h1> elements`);
  }
  check('page basics (doctype, lang, viewport, title, description, single h1)', bad, `${PAGES.length} pages`);
}

// 2. Internal links, scripts, stylesheets and images resolve; #anchors exist
{
  const bad = [];
  let n = 0;
  const external = new Map();
  for (const p of PAGES) {
    const s = stripScripts(html[p]);
    for (const m of s.matchAll(/\s(?:href|src|action)="([^"]*)"/g)) {
      const url = m[1];
      if (/^(https?:|mailto:|tel:)/i.test(url)) { external.set(url.split('?')[0], (external.get(url.split('?')[0]) || 0) + 1); continue; }
      n++;
      const [file, hash] = url.split('#');
      let target = p;
      if (file) {
        target = path.posix.normalize(path.posix.join(path.posix.dirname(p), file.split('?')[0]));
        if (target.endsWith('/') || target === '.') target = path.posix.join(target, 'index.html');
        if (target.startsWith('..') || !fs.existsSync(path.join(ROOT, target))) { bad.push(`${p}: "${url}" → missing ${target}`); continue; }
        if (fs.statSync(path.join(ROOT, target)).isDirectory()) target = path.posix.join(target, 'index.html');
      }
      if (hash && target.endsWith('.html') && !ids(html[target] ?? read(target)).includes(hash)) bad.push(`${p}: "${url}" → no id="${hash}" in ${target}`);
    }
  }
  check('internal links, assets and #anchors resolve', bad, `${n} references`);
  const placeholders = [...external.keys()].filter(u => /REPLACE|YOUR-|example\.com|TODO|localhost/i.test(u));
  // The contact forms' Formspree placeholder is covered by the WhatsApp hand-off in assets/ai.js; anything else is a failure
  const handedOff = u => /formspree\.io\/f\/REPLACE-WITH/.test(u) && read('assets/ai.js').includes('REPLACE-WITH');
  check('no placeholder external URLs', placeholders.filter(u => !handedOff(u)).map(u => `${u} (used ${external.get(u)}×)`), `${external.size} distinct external URLs`);
  for (const u of placeholders.filter(handedOff)) todo.push(`contact forms still use the placeholder ${u} (${external.get(u)}×) — they hand over to WhatsApp until a real form ID is set`);
}

// 3. CSS url() references resolve
{
  const css = read('styles.css');
  const bad = [...css.matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/["']/g, '')).filter(u => !/^(data:|https?:)/.test(u) && !fs.existsSync(path.join(ROOT, u)));
  check('stylesheet url() files exist', bad.map(u => `styles.css: ${u}`));
}

// 4. Duplicate ids
{
  const bad = [];
  for (const p of PAGES) {
    const seen = new Set();
    for (const id of ids(html[p])) { if (seen.has(id)) bad.push(`${p}: duplicate id="${id}"`); seen.add(id); }
  }
  check('no duplicate ids', bad);
}

// 5. Structured data parses
{
  const bad = [];
  let n = 0;
  for (const p of PAGES) {
    for (const m of html[p].matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      n++;
      try { const d = JSON.parse(m[1]); if (!d['@context'] || !d['@type']) bad.push(`${p}: JSON-LD without @context/@type`); } catch (e) { bad.push(`${p}: JSON-LD does not parse (${e.message})`); }
    }
  }
  check('JSON-LD structured data parses', bad, `${n} blocks`);
}

// 6. Translations: every data-i18n key used has BM and 中文 text
{
  const bad = [];
  let n = 0;
  for (const p of SRC_PAGES) {
    const m = /<script id="i18n-data">([\s\S]*?)<\/script>/.exec(html[p]);
    const { zhText, msText, TITLES } = vm.runInNewContext(`${m[1]};({ zhText, msText, TITLES })`);
    const used = new Set([...stripScripts(html[p]).matchAll(/\sdata-i18n(?:-ph)?="([^"]+)"/g)].map(x => x[1]));
    n += used.size;
    for (const k of used) {
      if (!zhText[k]) bad.push(`${p}: no 中文 text for "${k}"`);
      if (!msText[k]) bad.push(`${p}: no BM text for "${k}"`);
    }
    for (const l of ['ms', 'zh']) if (!TITLES[l]) bad.push(`${p}: no ${l} title`);
  }
  check('every translatable string has BM and 中文 text', bad, `${n} keys across ${SRC_PAGES.length} pages`);
}

// 7. Generated ms/ zh/ copies are current
{
  let bad = [];
  try { execFileSync('node', [path.join(ROOT, 'tools/build-i18n.mjs'), '--check'], { stdio: 'pipe' }); } catch (e) { bad = String(e.stderr).trim().split('\n'); }
  check('generated BM / 中文 pages match their sources', bad);
}

// 8. SEO wiring: canonical, hreflang, sitemap, share image, icons
{
  const bad = [];
  const SITE = 'https://jontech-solutions.com/';
  const sitePath = p => p.replace(/(^|\/)index\.html$/, '$1');
  for (const p of PAGES) {
    const s = html[p];
    const canon = /<link rel="canonical" href="([^"]*)"/.exec(s)?.[1];
    if (canon !== SITE + sitePath(p)) bad.push(`${p}: canonical is ${canon}`);
    const alts = [...s.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
    if (alts.length !== 4) bad.push(`${p}: ${alts.length} hreflang links`);
    for (const [, , href] of alts) {
      const f = href.replace(SITE, '');
      const file = f === '' || f.endsWith('/') ? f + 'index.html' : f;
      if (!fs.existsSync(path.join(ROOT, file))) bad.push(`${p}: hreflang → missing ${file}`);
    }
    for (const prop of ['og:title', 'og:description', 'og:image', 'og:url']) if (!new RegExp(`<meta property="${prop}" content="[^"]+"`).test(s)) bad.push(`${p}: no ${prop}`);
    const og = /<meta property="og:image" content="([^"]+)"/.exec(s)?.[1] ?? '';
    if (!fs.existsSync(path.join(ROOT, og.replace(SITE, '').split('?')[0]))) bad.push(`${p}: og:image file missing (${og})`);
    for (const m of s.matchAll(/<link rel="(?:icon|apple-touch-icon)" href="([^"]+)"/g)) {
      if (!fs.existsSync(path.join(ROOT, path.posix.normalize(path.posix.join(path.posix.dirname(p), m[1]))))) bad.push(`${p}: icon missing ${m[1]}`);
    }
    if (!/<script src="[^"]*assets\/theme\.js"><\/script>[\s\S]*<\/head>/.test(s)) bad.push(`${p}: theme.js is not a plain blocking script in <head>`);
  }
  const sm = read('sitemap.xml');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  for (const l of locs) {
    const f = l.replace(SITE, '');
    if (!fs.existsSync(path.join(ROOT, f === '' || f.endsWith('/') ? f + 'index.html' : f))) bad.push(`sitemap.xml: ${l} has no file`);
  }
  if (locs.length !== PAGES.length) bad.push(`sitemap.xml lists ${locs.length} URLs for ${PAGES.length} pages`);
  if (!/Sitemap:\s*https:\/\/jontech-solutions\.com\/sitemap\.xml/i.test(read('robots.txt'))) bad.push('robots.txt does not point at the sitemap');
  check('SEO wiring (canonical, hreflang, sitemap, share image, icons, theme script)', bad, `${locs.length} sitemap URLs`);
}

// 9. Stylesheet: variables defined, dark palette complete, braces balanced
{
  const css = read('styles.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const bad = [];
  const block = sel => { const i = css.indexOf(sel + '{'); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
  const defs = b => new Set([...b.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  const light = defs(block(':root')), dark = defs(block(':root[data-theme="dark"]'));
  // var(--x, fallback) is allowed to be undefined: script sets it (the card glow's pointer position)
  const used = new Set([...css.matchAll(/var\((--[\w-]+)/g)].map(m => m[1]));
  const optional = new Set([...css.matchAll(/var\((--[\w-]+),/g)].map(m => m[1]));
  for (const v of used) if (!light.has(v) && !optional.has(v)) bad.push(`var(${v}) is used but never defined`);
  for (const v of dark) if (!light.has(v)) bad.push(`${v} is defined for dark only`);
  for (const v of light) if (!used.has(v)) bad.push(`${v} is defined but unused`);
  const open = (css.match(/{/g) || []).length, close = (css.match(/}/g) || []).length;
  if (open !== close) bad.push(`unbalanced braces: ${open} "{" vs ${close} "}"`);
  check('stylesheet variables and structure', bad, `${light.size} variables, ${dark.size} overridden in dark`);
}

// 10. Scripts parse
{
  const bad = [];
  for (const f of ['assets/theme.js', 'assets/i18n.js', 'assets/ai.js', 'tools/build-i18n.mjs', 'tools/indexnow.mjs', 'worker/src/index.js', 'worker/src/knowledge.js']) {
    try { execFileSync('node', ['--check', path.join(ROOT, f)], { stdio: 'pipe' }); } catch (e) { bad.push(`${f}: ${String(e.stderr).split('\n')[0]}`); }
  }
  let n = 0;
  for (const p of PAGES) {
    for (const m of html[p].matchAll(/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
      n++;
      try { new vm.Script(m[1]); } catch (e) { bad.push(`${p}: inline script: ${e.message}`); }
    }
  }
  check('all scripts parse', bad, `7 files, ${n} inline scripts`);
}

let failed = 0;
for (const r of results) {
  const ok = r.problems.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.name}${r.info ? `  [${r.info}]` : ''}`);
  for (const p of r.problems.slice(0, 25)) console.log(`        - ${p}`);
  if (r.problems.length > 25) console.log(`        … and ${r.problems.length - 25} more`);
}
for (const x of todo) console.log(`TODO  ${x}`);
console.log(`\n${results.length - failed}/${results.length} static check groups passed`);
process.exit(failed ? 1 : 0);
