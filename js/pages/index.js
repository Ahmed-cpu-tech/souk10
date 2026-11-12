/* ============================================================
   Souk10 — page d'accueil : catégories, recherche, grille
   ============================================================ */
'use strict';

(async () => {
  const me = await API.init();
  const params = qs();
  const grid = $('#grid');
  grid.innerHTML = UI.loader();

  /* ----- Catégories (chips + select) ----- */
  try {
    const cats = await API.get('categories');
    const chipHost = $('#cat-chips');
    const sel = $('#sc-cat');

    const cur = params.get('category') || '';
    chipHost.innerHTML =
      `<a class="cat-chip ${cur === '' ? 'on' : ''}" href="index.html"><span class="cat-ico">🛍️</span> ${t('all_categories')}</a>` +
      cats.map(c => {
        const name = I18N.lang === 'ar' ? c.name_ar : c.name_fr;
        const on = cur !== '' && Number(cur) === c.id;
        return `<a class="cat-chip ${on ? 'on' : ''}" href="index.html?category=${c.id}">
                  <span class="cat-ico">${c.icon}</span> ${esc(name)} <b>${c.cnt}</b>
                </a>`;
      }).join('');

    sel.innerHTML = `<option value="">${t('all_categories')}</option>` +
      cats.map(c => `<option value="${c.id}" ${Number(cur) === c.id ? 'selected' : ''}>${c.icon} ${esc(I18N.lang === 'ar' ? c.name_ar : c.name_fr)}</option>`).join('');
  } catch (e) {
    toast(apiErrorText(e), 'err');
  }

  /* ----- Villes (datalist) ----- */
  $('#cities-dl').innerHTML = I18N.cities[I18N.lang].map(c => `<option value="${esc(c)}">`).join('');

  /* ----- Pré-remplir le formulaire depuis l'URL ----- */
  const form = $('.search-card');
  for (const k of ['q', 'city', 'min', 'max', 'sort', 'category']) {
    const v = params.get(k);
    if (v !== null && form.elements[k]) form.elements[k].value = v;
  }

  /* ----- Charger les annonces ----- */
  const load = async (page) => {
    grid.innerHTML = UI.loader();
    const p = {};
    for (const k of ['q', 'category', 'city', 'min', 'max', 'sort']) {
      const v = params.get(k);
      if (v) p[k] = v;
    }
    p.page = page;
    try {
      const d = await API.get('listings', p);
      $('#results-title').innerHTML =
        (params.get('q') ? esc(t('search_q', { q: params.get('q') })) : t('latest_title')) +
        ` <span class="count-pill">${d.total}</span>`;
      if (!d.items.length) {
        grid.innerHTML = UI.emptyState('🔎', 'no_results', 'no_results_sub',
          me ? `<a class="btn btn-primary" href="create.html">➕ ${t('nav_publish')}</a>` : '');
        UI.pager($('#pager'), 1, 1, () => {});
        return;
      }
      UI.renderGrid(grid, d.items);
      UI.pager($('#pager'), d.page, d.pages, (pg) => {
        const u = new URL(location.href);
        u.searchParams.set('page', pg);
        go(u.toString());
      });
    } catch (e) {
      grid.innerHTML = UI.emptyState('⚠️', 'error_generic');
    }
  };

  await load(Number(params.get('page') || 1));
})();
