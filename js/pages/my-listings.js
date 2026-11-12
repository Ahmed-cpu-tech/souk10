/* ============================================================
   Souk10 — mes annonces : modifier, supprimer, vendu / réouvrir
   ============================================================ */
'use strict';

(async () => {
  const me = await API.init();
  if (!API.requireAuth(me)) return;

  const rows = $('#rows');
  const load = async () => {
    rows.innerHTML = UI.loader();
    let items;
    try {
      items = await API.get('listings/mine');
    } catch (e) {
      rows.innerHTML = UI.emptyState('⚠️', 'error_generic');
      return;
    }

    if (!items.length) {
      rows.innerHTML = UI.emptyState('📦', 'ml_empty', '', `<a class="btn btn-primary" href="create.html">➕ ${t('nav_publish')}</a>`);
      return;
    }

    rows.innerHTML = items.map(l => {
      const sold = l.status === 'sold';
      return `
      <div class="myrow ${sold ? 'is-sold' : ''}" data-id="${l.id}">
        <a class="myrow-img" href="listing.html?id=${l.id}">
          <img src="${esc(listingImg(l.image))}" alt="${esc(l.title)}" onerror="this.src='${BASE}/img/placeholder.svg'">
        </a>
        <div class="myrow-info">
          <a class="myrow-title" href="listing.html?id=${l.id}">${esc(l.title)}</a>
          <div class="myrow-meta">
            <span class="price" style="font-weight:800">${money(l.price)}</span>
            ${UI.statusChip(l.status)}
            ${l.cat_icon ? `<span class="chip-mini">${l.cat_icon} ${esc(I18N.lang === 'ar' ? l.cat_ar : l.cat_fr)}</span>` : ''}
            <span class="chip-mini">🕒 ${timeAgo(l.created_at)}</span>
          </div>
          ${sold && l.net !== null ? `<div class="myrow-meta" style="margin-top:6px">
              <span class="chip-mini chip-net">💰 ${t('net_for_you', { x: money(l.net) })}</span>
            </div>` : ''}
        </div>
        <div class="myrow-actions">
          <a class="btn btn-ghost btn-sm" href="edit.html?id=${l.id}">${t('btn_edit')}</a>
          ${sold
            ? `<button class="btn btn-ghost btn-sm act-reopen" data-id="${l.id}">${t('btn_reopen')}</button>`
            : `<button class="btn btn-success btn-sm act-sold" data-id="${l.id}">${t('btn_mark_sold')}</button>`}
          <button class="btn btn-danger btn-sm act-del" data-id="${l.id}">${t('btn_delete')}</button>
        </div>
      </div>`;
    }).join('');

    /* ----- Actions ----- */
    $$('.act-sold', rows).forEach(b => b.addEventListener('click', async () => {
      if (!confirm(t('confirm_sold'))) return;
      b.disabled = true;
      try {
        const r = await API.post('listings/sold', { id: Number(b.dataset.id), to: 'sold' });
        toast(t('marked_sold_ok') + ' — ' + t('net_for_you', { x: money(r.net) }), 'ok', 4500);
        load();
      } catch (e) { b.disabled = false; toast(apiErrorText(e), 'err'); }
    }));

    $$('.act-reopen', rows).forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      try {
        await API.post('listings/sold', { id: Number(b.dataset.id), to: 'active' });
        toast(t('reopen_ok'), 'ok');
        load();
      } catch (e) { b.disabled = false; toast(apiErrorText(e), 'err'); }
    }));

    $$('.act-del', rows).forEach(b => b.addEventListener('click', async () => {
      if (!confirm(t('confirm_delete'))) return;
      b.disabled = true;
      try {
        await API.post('listings/delete', { id: Number(b.dataset.id) });
        toast(t('deleted_ok'), 'ok');
        load();
      } catch (e) { b.disabled = false; toast(apiErrorText(e), 'err'); }
    }));
  };

  await load();
})();
