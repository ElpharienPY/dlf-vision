// ── PAGE TRANSITION ──
(function () {
  const DURATION = 750; // ms
  const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

  const overlay = document.getElementById('page-transition');
  if (!overlay) return;

  // À l'arrivée sur la page : l'overlay couvre déjà l'écran (inline style),
  // on le fait glisser vers le haut pour révéler la page.
  window.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.style.transition = `transform ${DURATION}ms ${EASE}`;
      overlay.style.transform  = 'translateY(-100%)';
    }));
  });

  // Au clic sur un lien interne : on couvre d'abord, puis on navigue.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    // Ignorer les ancres, les liens externes et les mailto
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

    e.preventDefault();

    overlay.style.transition = `transform ${DURATION}ms ${EASE}`;
    overlay.style.transform  = 'translateY(0)';

    setTimeout(() => { window.location.href = href; }, DURATION);
  });
})();
