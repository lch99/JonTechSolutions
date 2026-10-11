/* JonTech light / dark theme, shared by every page.
 *
 * Loaded in <head> so the theme is set before the page first paints. The site follows the
 * visitor's system setting until they use a [data-theme-toggle] button; only that explicit
 * choice is remembered. styles.css holds the colours for each theme.
 */
(function () {
  const KEY = 'jontech-theme';
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');

  function saved() {
    try {
      const t = localStorage.getItem(KEY);
      return t === 'dark' || t === 'light' ? t : null;
    } catch (e) { return null; }
  }
  function apply() { root.dataset.theme = saved() || (system.matches ? 'dark' : 'light'); }

  apply();
  system.addEventListener('change', apply);
  // Keep other open tabs, and pages restored by the Back button, in step with the latest choice
  addEventListener('storage', e => { if (e.key === KEY) apply(); });
  addEventListener('pageshow', e => { if (e.persisted) apply(); });
  // Paper is white, so always print the light theme
  addEventListener('beforeprint', () => { root.dataset.theme = 'light'; });
  addEventListener('afterprint', apply);

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-theme-toggle]')) return;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch (err) {}
    root.dataset.theme = next;
  });
})();
