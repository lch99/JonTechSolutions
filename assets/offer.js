/* Private pages (offers/*.html): a brochure or price list only people with its link can read.
 *
 * tools/private-pages.mjs encrypts each page's <main> and translations. The key is the part of the
 * link after "#", which browsers never send to a server, so GitHub, search engines and anyone reading
 * the repo only ever get the locked page. This unlocks the page with that key, then runs the nav,
 * the sections that fade in and the language switch. The readable sources (private/*.html) load it
 * too, and skip the unlocking.
 */
(function () {
  const i18nScript = new URL('i18n.js', document.currentScript.src).href;
  const payload = document.getElementById('offer-data');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  document.addEventListener('click', e => {
    if (!e.target.closest) return;
    // "Save as PDF": the print stylesheet lays the brochure out as one A4 page
    if (e.target.closest('[data-print]')) return print();
    // Links within the page scroll there without changing the address, which would drop the key
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    e.preventDefault();
    const id = link.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (target) scrollTo({ top: target.getBoundingClientRect().top + scrollY - 72, behavior: reduced.matches ? 'auto' : 'smooth' });
  });

  const nav = document.getElementById('nav');
  addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  }
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  function revealOnScroll() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  // A readable source page loads its own translations and i18n.js
  if (!payload) return revealOnScroll();

  // base64 or base64url, with or without padding and line breaks
  const bytes = text => Uint8Array.from(atob(text.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

  async function unlock() {
    const key = await crypto.subtle.importKey('raw', bytes(location.hash.slice(1)), 'AES-GCM', false, ['decrypt']);
    const sealed = bytes(payload.textContent);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: sealed.subarray(0, 12) }, key, sealed.subarray(12));
    return JSON.parse(new TextDecoder().decode(plain));
  }

  unlock().then(({ main, i18n }) => {
    document.getElementById('offer').innerHTML = main;
    // zhText, msText and TITLES, which i18n.js reads as globals
    Object.assign(window, i18n);
    const script = document.createElement('script');
    script.src = i18nScript;
    document.body.append(script);
    revealOnScroll();
  }, () => {
    // No key, a wrong or cut-off key, or a browser without Web Crypto
    document.getElementById('offer-lock').classList.add('show');
  });
})();
