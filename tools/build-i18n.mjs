// Builds the Malay and Chinese copies of every page (ms/index.html, ms/services/pos-system.html,
// zh/…) so search engines can index them — the English pages only translate themselves in the
// browser — and writes sitemap.xml with each page's language alternates.
// Each page keeps its translations in a <script id="i18n-data"> block (zhText, msText, TITLES).
// Usage: node tools/build-i18n.mjs           rebuild (no dependencies; rerun after editing a page)
//        node tools/build-i18n.mjs --check   exit 1 if the committed copies are out of date
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://jontech-solutions.com';

const LANGS = {
  ms: { htmlLang: 'ms', ogLocale: 'ms_MY' },
  zh: { htmlLang: 'zh-CN', ogLocale: 'zh_CN' },
};

// Source file → sitemap priority and meta descriptions per language.
const PAGES = {
  'index.html': {
    priority: '1.0',
    description: {
      ms: 'Perkhidmatan IT di Malaysia untuk PKS dan syarikat permulaan — perisian tersuai, sistem POS, aplikasi web dan mudah alih, automasi dan AI praktikal. Konsultasi percuma.',
      zh: '马来西亚 IT 服务——为中小企业与初创公司提供定制软件、POS 系统、网站与手机应用开发、自动化及实用 AI。免费咨询，并可免费试用 AI 网站 UI/UX 检测。',
    },
  },
  'services/it-services.html': {
    priority: '0.9',
    description: {
      ms: 'Perkhidmatan IT untuk PKS dan syarikat permulaan di Malaysia — perisian tersuai, sistem POS, aplikasi web dan mudah alih, integrasi sistem, automasi ujian dan AI praktikal. Konsultasi percuma.',
      zh: '为马来西亚中小企业和初创公司提供 IT 服务——定制软件、POS 系统、网站与手机应用、系统集成、测试自动化和实用 AI。免费咨询。',
    },
  },
  'services/pos-system.html': {
    priority: '0.9',
    description: {
      ms: 'Sistem POS tersuai untuk peruncit, F&B dan perniagaan perkhidmatan di Malaysia — inventori, laporan jualan dan aliran kerja staf yang dibina mengikut cara anda beroperasi.',
      zh: '为马来西亚零售、餐饮和服务业打造的定制 POS 系统——库存管理、销售报表和员工流程，完全按照您的经营方式设计。',
    },
  },
  'services/custom-software.html': {
    priority: '0.9',
    description: {
      ms: 'Perisian perniagaan tersuai — sistem tempahan, portal pejabat belakang dan alatan dalaman yang dibina mengikut proses anda, bukan templat SaaS generik.',
      zh: '定制业务软件——预约系统、后台管理门户和内部工具，围绕您的流程打造，而不是通用 SaaS 模板。',
    },
  },
  'services/ai-automation.html': {
    priority: '0.9',
    description: {
      ms: 'Automasi AI praktikal untuk PKS — automasikan balasan pelanggan, pemprosesan dokumen dan keputusan berulang tanpa perlu mengupah pasukan sains data.',
      zh: '为中小企业提供实用的 AI 自动化——自动回复客户、处理文件和重复决策，无需组建数据科学团队。',
    },
  },
  'services/web-development.html': {
    priority: '0.9',
    description: {
      ms: 'Aplikasi web moden yang pantas dibina dari hujung ke hujung — UI yang kemas, backend yang boleh dipercayai dan sistem yang berkembang bersama perniagaan anda.',
      zh: '从前端到后端打造快速、现代的网页应用——简洁的界面、可靠的后端，系统随业务一起成长。',
    },
  },
  'services/mobile-app-development.html': {
    priority: '0.9',
    description: {
      ms: 'Aplikasi mudah alih tersuai untuk operasi perniagaan dan pelanggan — dibina untuk berfungsi dengan baik di lapangan, bukan sekadar dalam demo.',
      zh: '为业务运营和客户打造的定制手机应用——在外勤现场稳定运行，而不只是在演示中好看。',
    },
  },
  'contact.html': {
    priority: '0.8',
    description: {
      ms: 'Hubungi JonTech Solutions untuk panggilan skop percuma — sistem POS, perisian tersuai, automasi AI, pembangunan web dan aplikasi mudah alih. Berpangkalan di Malaysia.',
      zh: '联系 JonTech Solutions，预约免费需求沟通——POS 系统、定制软件、AI 自动化、网站与手机应用开发。立足马来西亚。',
    },
  },
};

// Site path of a page: the home page is the folder itself
const sitePath = page => page.replace(/(^|\/)index\.html$/, '$1');
// Relative URL from folder `fromDir` ('.' = site root) to site path `to` ('' or 'x/' = a folder)
function relUrl(fromDir, to) {
  const isDir = to === '' || to.endsWith('/');
  const r = path.posix.relative(path.posix.join('/', fromDir), path.posix.join('/', isDir ? to.replace(/\/$/, '') : to));
  return isDir ? (r ? `${r}/` : './') : r;
}

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

// The page's translations, evaluated from its <script id="i18n-data"> block.
function readTranslations(src, file) {
  const m = /<script id="i18n-data">([\s\S]*?)<\/script>/.exec(src);
  if (!m) throw new Error(`${file} has no <script id="i18n-data"> block`);
  const { zhText, msText, TITLES } = vm.runInNewContext(`${m[1]};({ zhText, msText, TITLES })`);
  return { texts: { zh: zhText, ms: msText }, titles: TITLES };
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

// Links on a generated page (which sits in the ms/ or zh/ folder): links to translated pages go to
// the same language's copy, everything else (English-only files, assets) to the original.
function rebaseLinks(html, page, lang) {
  const srcDir = path.posix.dirname(page);
  const outDir = path.posix.join(lang, srcDir);
  return html.replace(/(\s(?:href|src)=")([^"]*)"/g, (all, attr, url) => {
    if (!url || /^(#|\/|[a-z][a-z0-9+.-]*:)/i.test(url)) return all;
    const [, p, rest] = /^([^#?]*)(.*)$/.exec(url);
    const file = path.posix.normalize(path.posix.join(srcDir, p === '' || p.endsWith('/') ? p + 'index.html' : p));
    const dest = file in PAGES ? `${lang}/${sitePath(file)}` : sitePath(file);
    return `${attr}${relUrl(outDir, dest)}${rest}"`;
  });
}

// Point each EN / BM / 中文 link at this page in that language, and mark the current one.
function setLanguageLinks(html, page, lang) {
  const outDir = path.posix.join(lang, path.posix.dirname(page));
  const target = l => relUrl(outDir, l === 'en' ? sitePath(page) : `${l}/${sitePath(page)}`);
  let count = 0;
  html = html.replace(OPEN_TAG_G, tag => {
    const l = /^<a\s[^>]*\sdata-lang="(\w+)"/.exec(tag);
    if (!l) return tag;
    count++;
    tag = tag.replace(/\sclass="active"|\saria-current="true"/g, '').replace(/(\shref=")[^"]*"/, `$1${target(l[1])}"`);
    return l[1] === lang ? tag.replace(/\/?>$/, ' class="active" aria-current="true"$&') : tag;
  });
  if (count !== Object.keys(LANGS).length + 1) throw new Error(`${page}: expected ${Object.keys(LANGS).length + 1} language links, found ${count}`);
  return html;
}

function build(page, lang) {
  const src = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const { texts, titles } = readTranslations(src, page);
  const cfg = LANGS[lang];
  const dict = texts[lang];
  const url = `${SITE}/${lang}/${sitePath(page)}`;
  const title = titles[lang];
  if (!dict.heroSub) throw new Error(`${page}: ${lang} text needs a heroSub (used for og:description)`);
  const ogDesc = toPlainText(dict.heroSub);

  // Keep inline scripts (JSON-LD and the page scripts) out of the HTML rewriting.
  const scripts = [];
  let html = src.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g, (all, a, body, c) => {
    scripts.push(body);
    return `${a}\u0000${scripts.length - 1}\u0000${c}`;
  });

  html = replaceOne(html, /<html lang="en">/, `<html lang="${cfg.htmlLang}" data-page-lang="${lang}">`);
  html = replaceOne(html, /<!DOCTYPE html>(\r?\n)/, `$&<!-- Generated from ${page} by tools/build-i18n.mjs — edit ${page} and rerun, don't edit this file. -->$1`);
  html = replaceOne(html, /<title>[^<]*<\/title>/, `<title>${escText(title)}</title>`);
  html = replaceOne(html, /(<meta name="description" content=")[^"]*"/, `$1${escAttr(PAGES[page].description[lang])}"`);
  html = replaceOne(html, /(<link rel="canonical" href=")[^"]*"/, `$1${url}"`);
  html = replaceOne(html, /(<meta property="og:url" content=")[^"]*"/, `$1${url}"`);
  html = replaceOne(html, /(<meta property="og:locale" content=")[^"]*"/, `$1${cfg.ogLocale}"`);
  html = replaceOne(html, /(<meta property="og:title" content=")[^"]*"/, `$1${escAttr(title)}"`);
  html = replaceOne(html, /(<meta property="og:description" content=")[^"]*"/, `$1${escAttr(ogDesc)}"`);
  html = replaceOne(html, /(<meta name="twitter:title" content=")[^"]*"/, `$1${escAttr(title)}"`);
  html = replaceOne(html, /(<meta name="twitter:description" content=")[^"]*"/, `$1${escAttr(ogDesc)}"`);
  html = translateBody(html, dict);
  html = rebaseLinks(html, page, lang);
  html = setLanguageLinks(html, page, lang);

  html = html.replace(/\u0000(\d+)\u0000/g, (all, i) => scripts[i]);
  // FAQ structured data must match the visible text, which is now translated
  return html.replace(/<script type="application\/ld\+json">[^<]*"FAQPage"[^<]*<\/script>\r?\n/g, '');
}

// Every page in every language, each listing all of its language versions
function sitemap() {
  const versions = page => [['en', sitePath(page)], ...Object.keys(LANGS).map(l => [l, `${l}/${sitePath(page)}`])];
  const urls = Object.entries(PAGES).flatMap(([page, { priority }]) => versions(page).map(([, p]) => [
    '  <url>',
    `    <loc>${SITE}/${p}</loc>`,
    ...versions(page).map(([l, alt]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}/${alt}"/>`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/${sitePath(page)}"/>`,
    '    <changefreq>monthly</changefreq>',
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n')));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\r\n').replace(/\r?\n/g, '\r\n');
}

const outputs = [];
for (const page of Object.keys(PAGES)) {
  for (const lang of Object.keys(LANGS)) outputs.push([path.join(lang, page), build(page, lang)]);
}
outputs.push(['sitemap.xml', sitemap()]);

// --check: fail if the committed files are out of date (nothing is written)
const check = process.argv.includes('--check');
let stale = false;
for (const [rel, content] of outputs) {
  const out = path.join(ROOT, rel);
  if (check) {
    const current = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
    if (current !== content) { stale = true; console.error(`${rel} is out of date — run node tools/build-i18n.mjs`); }
  } else {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, content);
    console.log(`wrote ${rel}`);
  }
}
if (stale) process.exit(1);
