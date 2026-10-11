/* JonTech motion helpers, shared by every page.
 *
 * The animations themselves are CSS (the MOTION section of styles.css). This tells the cards where
 * the pointer is, so their glow can follow it, and runs the home page's product reel.
 */
(function () {
  if (!matchMedia('(hover: hover)').matches) return;
  const CARDS = '.svc-card, .proj, .ai-card, .about-card, .problem-card';
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest && e.target.closest(CARDS);
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
})();

/* The product reel (.reel-video): one silent loop per language, rendered by marketing/xhs/render.mjs.
 * Nothing is downloaded until it scrolls into view, it pauses off screen, and with reduced motion it
 * stays on its poster.
 */
(function () {
  const video = document.querySelector('.reel-video');
  if (!video) return;
  const source = video.querySelector('source');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  function sync() {
    const lang = { ms: 'ms', 'zh-CN': 'zh' }[document.documentElement.lang] || 'en';
    const file = source.getAttribute('src').replace(/reel-\w+\.mp4$/, `reel-${lang}.mp4`);
    if (source.getAttribute('src') !== file) {
      source.setAttribute('src', file);
      video.poster = file.replace(/mp4$/, 'webp');
      video.load();
    }
    if (visible && !still.matches) video.play().catch(() => {}); else video.pause();
  }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.25 }).observe(video);
  new MutationObserver(sync).observe(document.documentElement, { attributeFilter: ['lang'] });
  still.addEventListener('change', sync);
  sync();
})();
