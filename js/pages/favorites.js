/* ============================================================
   Souk10 — favoris de l'utilisateur
   ============================================================ */
'use strict';

(async () => {
  const me = await API.init();
  if (!API.requireAuth(me)) return;

  const grid = $('#grid');
  grid.innerHTML = UI.loader();

  try {
    const items = await API.get('favorites');
    if (!items.length) {
      grid.innerHTML = UI.emptyState('💔', 'fav_empty', '', `<a class="btn btn-primary" href="index.html">${t('nav_home')}</a>`);
      return;
    }
    /* Grille sans binding automatique : on gère le ♥ à notre façon (retirer la carte) */
    UI.renderGrid(grid, items, { hearts: false });

    $$('.heart', grid).forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          await API.post('favorites/toggle', { listing_id: Number(id) });
          const card = btn.closest('.card');
          if (card) {
            card.style.transition = 'opacity .25s, transform .25s';
            card.style.opacity = '0';
            card.style.transform = 'scale(.95)';
            setTimeout(() => {
              card.remove();
              if (!$$('.card', grid).length) {
                grid.innerHTML = UI.emptyState('💔', 'fav_empty', '', `<a class="btn btn-primary" href="index.html">${t('nav_home')}</a>`);
              }
            }, 260);
          }
          toast(t('fav_removed'), 'ok', 2000);
        } catch (err) {
          toast(apiErrorText(err), 'err');
        }
      });
    });
  } catch (e) {
    grid.innerHTML = UI.emptyState('⚠️', 'error_generic');
  }
})();
