/* JonTech language switch (EN / BM / 中文), shared by every translated page.
 *
 * Each page defines zhText, msText and TITLES in a <script id="i18n-data"> block before loading
 * this file. tools/build-i18n.mjs also reads that block to generate the static ms/ and zh/ copies
 * of the page, so rerun it after editing a page's text.
 */
(function () {
  const TEXTS = { zh: zhText, ms: msText };
  const HTML_LANG = { en: 'en', ms: 'ms', zh: 'zh-CN' };
  const enTitle = document.title;
  const i18nOriginal = new Map();
  const phOriginal = new Map();

  // Soft fade on the text you can see, layered on top of any CSS animation
  function fadeInTranslated() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (!r.height || r.bottom < 0 || r.top > innerHeight) return;
      el.animate([{ opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 450, easing: 'ease-out' });
    });
  }

  function setLanguage(lang, animate) {
    if (!HTML_LANG[lang]) lang = 'en';
    const dict = TEXTS[lang] || {};
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!i18nOriginal.has(el)) i18nOriginal.set(el, el.innerHTML);
      el.innerHTML = dict[key] || i18nOriginal.get(el);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      if (!phOriginal.has(el)) phOriginal.set(el, el.placeholder);
      el.placeholder = dict[el.getAttribute('data-i18n-ph')] || phOriginal.get(el);
    });
    document.documentElement.lang = HTML_LANG[lang];
    document.title = TITLES[lang] || enTitle;
    document.querySelectorAll('.lang-switch a').forEach(a => {
      a.classList.toggle('active', a.dataset.lang === lang);
      if (a.dataset.lang === lang) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    document.dispatchEvent(new CustomEvent('jontech:lang', { detail: lang }));
    if (animate) fadeInTranslated();
  }

  // Set only on the generated pages, which are already rendered in their language
  const PAGE_LANG = document.documentElement.dataset.pageLang;

  // The switch is real links so search engines find each language's page. Only an explicit
  // choice is remembered. On an English page we translate in place; on a generated page we follow the link.
  document.querySelectorAll('.lang-switch a').forEach(link => {
    link.addEventListener('click', e => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      try { localStorage.setItem('jontech-lang', link.dataset.lang); } catch (err) {}
      if (PAGE_LANG) return;
      e.preventDefault();
      setLanguage(link.dataset.lang, true);
    });
  });

  if (!PAGE_LANG) {
    let savedLang = null;
    try { savedLang = localStorage.getItem('jontech-lang'); } catch (e) {}
    const browserLang = (navigator.language || '').toLowerCase();
    setLanguage(savedLang || (browserLang.startsWith('zh') ? 'zh' : browserLang.startsWith('ms') ? 'ms' : 'en'));
  }
})();
