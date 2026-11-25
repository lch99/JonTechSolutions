/* JonTech demo websites (demo/*.html).
 *
 * 1. Buttons that would reach the made-up site owner (WhatsApp, social links, share buttons, forms) explain
 *    what they do on a real site instead: anything with data-demo="…" shows that note when clicked, and a
 *    form with data-demo-form="…" shows its note when sent. Links to JonTech itself work normally.
 *
 * 2. Languages: EN, BM and 中文. Each demo keeps its own translations in
 *    <script id="demo-text" type="application/json">, keyed by the English text exactly as it appears on
 *    the page; the parts every demo shares are in SHARED below. Text that stays the same in every language
 *    (names, platforms) goes in "keep". The choice is shared with the rest of the site (localStorage
 *    "jontech-lang"), so someone reading the brochure in 中文 sees the demos in 中文 too.
 */
(function () {
  const HTML_LANG = { en: 'en', ms: 'ms', zh: 'zh-CN' };
  const T = (ms, zh) => ({ ms, zh });

  const SHARED = {
    // The demo bar, the offer at the end and the footer
    'Sample website by JonTech Solutions': T('Laman web contoh oleh JonTech Solutions', 'JonTech Solutions 制作的示范网站'),
    'Sample website': T('Laman web contoh', '示范网站'),
    'Blogger': T('Blogger', '博主'),
    'Car sales': T('Jualan kereta', '汽车销售'),
    'Property': T('Hartanah', '房产'),
    'Company': T('Syarikat', '公司'),
    'Get a website like this': T('Dapatkan laman web seperti ini', '我也想要这样的网站'),
    'Get one': T('Dapatkan', '我也要'),
    'Back to the website package': T('Kembali ke pakej laman web', '返回网站套餐'),
    'Back': T('Kembali', '返回'),
    'Demo websites': T('Laman web demo', '示范网站'),
    'Language': T('Bahasa', '语言'),
    'Site': T('Laman', '网站'),
    'Like this website?': T('Suka laman web ini?', '喜欢这个网站吗？'),
    'JonTech Solutions builds one like it for you, with design, copywriting, SEO and your social media included.':
      T('JonTech Solutions boleh bina laman web seperti ini untuk anda, termasuk reka bentuk, penulisan kandungan, SEO dan media sosial anda.',
        'JonTech Solutions 可以为您打造这样的网站，包含设计、文案、SEO 和社交媒体连接。'),
    'WhatsApp JonTech': T('WhatsApp JonTech', 'WhatsApp 联系 JonTech'),
    'A sample website by': T('Laman web contoh oleh', '示范网站，由'),
    '· Photos from Unsplash': T('· Foto daripada Unsplash', '制作 · 照片来自 Unsplash'),
    'Chat on WhatsApp': T('Sembang di WhatsApp', 'WhatsApp 聊天'),
    'On your website, this button stays on every page and opens a WhatsApp chat with you.':
      T('Di laman web anda, butang ini ada di setiap halaman dan membuka sembang WhatsApp dengan anda.',
        '在您的网站上，这个按钮会出现在每一页，一按就打开与您的 WhatsApp 聊天。'),
    // Share buttons
    'Share on WhatsApp': T('Kongsi di WhatsApp', '分享到 WhatsApp'),
    'Share on Facebook': T('Kongsi di Facebook', '分享到 Facebook'),
    'Copy link': T('Salin pautan', '复制链接'),
    'Visitors copy the link to share it anywhere.': T('Pelawat boleh salin pautan untuk dikongsi di mana-mana.', '访客可以复制链接，分享到任何地方。'),
    // What the social and contact buttons do
    'On your website, this opens your Instagram.': T('Di laman web anda, ini membuka Instagram anda.', '在您的网站上，这会打开您的 Instagram。'),
    'On your website, this opens your TikTok.': T('Di laman web anda, ini membuka TikTok anda.', '在您的网站上，这会打开您的 TikTok。'),
    'On your website, this opens your YouTube channel.': T('Di laman web anda, ini membuka saluran YouTube anda.', '在您的网站上，这会打开您的 YouTube 频道。'),
    'On your website, this opens your Facebook page.': T('Di laman web anda, ini membuka halaman Facebook anda.', '在您的网站上，这会打开您的 Facebook 专页。'),
    'On your website, this opens your Xiaohongshu (小红书).': T('Di laman web anda, ini membuka Xiaohongshu (小红书) anda.', '在您的网站上，这会打开您的小红书。'),
    'On your website, this opens a WhatsApp chat with you.': T('Di laman web anda, ini membuka sembang WhatsApp dengan anda.', '在您的网站上，这会打开与您的 WhatsApp 聊天。'),
    'On your website, your YouTube or TikTok video plays right here.':
      T('Di laman web anda, video YouTube atau TikTok anda dimainkan terus di sini.', '在您的网站上，您的 YouTube 或 TikTok 视频会直接在这里播放。'),
    'On your website, this enquiry goes straight to your email or WhatsApp.':
      T('Di laman web anda, pertanyaan ini terus masuk ke e-mel atau WhatsApp anda.', '在您的网站上，这份询问会直接发到您的邮箱或 WhatsApp。'),
    'On your website, this enquiry goes straight to your WhatsApp or email, so you can reply fast.':
      T('Di laman web anda, pertanyaan ini terus masuk ke WhatsApp atau e-mel anda, jadi anda boleh balas dengan cepat.',
        '在您的网站上，这份询问会直接发到您的 WhatsApp 或邮箱，方便您快速回复。'),
    // Common words
    'Ask for price': T('Tanya harga', '询问价格'),
    'Fastest reply': T('Balasan paling pantas', '回复最快'),
    'Your name': T('Nama anda', '您的名字'),
    'Phone': T('Telefon', '电话'),
    'Email': T('E-mel', '邮箱'),
    'Anything else?': T('Ada apa-apa lagi?', '还有其他需要吗？'),
  };
  // "Visitors share this story to WhatsApp, …" for every kind of post and both platforms
  const NOUNS = { story: T('cerita', '这篇文章'), car: T('kereta', '这款车'), listing: T('iklan hartanah', '这个房源'), guide: T('panduan', '这篇指南'), project: T('projek', '这个项目') };
  for (const [noun, t] of Object.entries(NOUNS)) {
    for (const app of ['WhatsApp', 'Facebook']) {
      SHARED[`Visitors share this ${noun} to ${app}, with a proper title and picture.`] =
        T(`Pelawat boleh kongsi ${t.ms} ini ke ${app}, lengkap dengan tajuk dan gambar.`, `访客可以把${t.zh}分享到 ${app}，自动带上标题和图片。`);
    }
  }
  const KEEP = ['DEMO', 'EN', 'BM', '中文', 'JonTech Solutions', 'Instagram', 'TikTok', 'YouTube', 'Facebook', 'WhatsApp', 'Xiaohongshu', '小红书'];

  const own = document.getElementById('demo-text');
  const page = own ? JSON.parse(own.textContent) : {};
  const TEXT = { ...SHARED, ...page.text };
  const keep = new Set([...KEEP, ...(page.keep || [])]);
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const englishTitle = document.title;
  const TITLE_END = { ms: ' · Demo oleh JonTech Solutions', zh: ' · JonTech Solutions 示范网站' };
  const ATTRS = ['data-demo', 'data-demo-form', 'aria-label'];
  const textOriginal = new Map();
  const attrOriginal = new Map();
  // English text this page shows but has no translation for (the tests read this)
  const missing = new Set();
  let current = 'en';

  const translated = (english, lang) => (lang === 'en' ? null : TEXT[norm(english)]?.[lang]);
  const needsWords = s => /[a-z]{2}/i.test(s) && !keep.has(norm(s));

  function textNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (!n.nodeValue.trim() || n.parentElement.closest('script, style, svg, .demo-toast') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function setLanguage(lang) {
    if (!HTML_LANG[lang]) lang = 'en';
    current = lang;
    missing.clear();
    for (const node of textNodes()) {
      if (!textOriginal.has(node)) textOriginal.set(node, node.nodeValue);
      const english = textOriginal.get(node);
      const t = translated(english, lang);
      // keep the spaces around the words, which separate them from the tags next to them
      node.nodeValue = t ? english.match(/^\s*/)[0] + t + english.match(/\s*$/)[0] : english;
      if (!t && lang !== 'en' && needsWords(english)) missing.add(norm(english));
    }
    for (const el of document.querySelectorAll(ATTRS.map(a => `[${a}]`).join(','))) {
      if (!attrOriginal.has(el)) attrOriginal.set(el, ATTRS.filter(a => el.hasAttribute(a)).map(a => [a, el.getAttribute(a)]));
      for (const [attr, english] of attrOriginal.get(el)) {
        const t = translated(english, lang);
        el.setAttribute(attr, t || english);
        if (!t && lang !== 'en' && attr !== 'aria-label' && needsWords(english)) missing.add(norm(english));
      }
    }
    document.title = lang === 'en' ? englishTitle : englishTitle.replace(' · Demo by JonTech Solutions', TITLE_END[lang]);
    document.documentElement.lang = HTML_LANG[lang];
    document.querySelectorAll('.demo-lang [data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  }
  window.demoLanguage = { set: setLanguage, missing };

  document.querySelectorAll('.demo-lang [data-lang]').forEach(button => {
    button.addEventListener('click', () => {
      try { localStorage.setItem('jontech-lang', button.dataset.lang); } catch (err) {}
      setLanguage(button.dataset.lang);
    });
  });
  let saved = null;
  try { saved = localStorage.getItem('jontech-lang'); } catch (err) {}
  const browser = (navigator.language || '').toLowerCase();
  setLanguage(saved || (browser.startsWith('zh') ? 'zh' : browser.startsWith('ms') ? 'ms' : 'en'));

  // ── Coming from the brochure ──
  // The brochure links here with ?from=brochure. Then "Back" returns to it by stepping back in the browser's
  // history, so the demo never needs the brochure's private link. The tabs swap pages without adding to that
  // history, so one step back always lands on the brochure, however many demos were looked at.
  let fromBrochure = false;
  try {
    if (new URLSearchParams(location.search).get('from') === 'brochure') {
      sessionStorage.setItem('demo-from', 'brochure');
      history.replaceState(history.state, '', location.pathname + location.hash);
    }
    fromBrochure = sessionStorage.getItem('demo-from') === 'brochure';
  } catch (err) {}
  const back = document.querySelector('.demo-back');
  if (back && fromBrochure && history.length > 1) {
    back.hidden = false;
    back.addEventListener('click', () => history.back());
  }
  document.querySelectorAll('.demo-tabs a').forEach(tab => {
    tab.addEventListener('click', e => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      location.replace(tab.href);
    });
  });

  // ── What a button would do on a real site ──
  const toast = document.createElement('div');
  toast.className = 'demo-toast';
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  let timer;

  function explain(text) {
    const label = document.createElement('b');
    label.textContent = { en: 'Demo: ', ms: 'Demo: ', zh: '演示：' }[current];
    toast.replaceChildren(label, text);
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('show'), 3600);
  }

  document.addEventListener('click', e => {
    const el = e.target.closest && e.target.closest('[data-demo]');
    if (!el) return;
    e.preventDefault();
    explain(el.dataset.demo);
  });

  document.addEventListener('submit', e => {
    const form = e.target.closest('[data-demo-form]');
    if (!form) return;
    e.preventDefault();
    explain(form.dataset.demoForm);
    form.reset();
  });
})();
