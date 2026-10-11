/* JonTech motion helpers, shared by every page.
 *
 * The animations themselves are CSS (the MOTION section of styles.css). This only tells the cards
 * where the pointer is, so their glow can follow it.
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
