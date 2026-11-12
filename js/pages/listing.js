/* ============================================================
   Souk10 — page annonce : détail, favoris, contacter le vendeur
   ============================================================ */
'use strict';

(async () => {
  const me = await API.init();
  const id = Number(qs().get('id') || 0);
  const host = $('#content');
  if (!id) { host.innerHTML = UI.emptyState('😕', 'not_found'); return; }
  host.innerHTML = UI.loader();

  let d;
  try {
    d = await API.get('listings/show', { id });
  } catch (e) {
    host.innerHTML = UI.emptyState('😕', 'not_found', '', `<a class="btn btn-ghost" href="index.html">${t('back_home')}</a>`);
    return;
  }

  const l = d.listing;
  document.title = esc(l.title) + ' — Souk10';
  const catName = I18N.lang === 'ar' ? l.cat_ar : l.cat_fr;
  const sold = l.status === 'sold';
  const commission = Math.round(l.price * API.rate * 100) / 100;
  const net = Math.round((l.price - commission) * 100) / 100;

  /* Zone image */
  const imgBox = `
    <div class="listing-img-box">
      <img src="${esc(listingImg(l.image))}" alt="${esc(l.title)}" onerror="this.src='${BASE}/img/placeholder.svg'">
      ${sold ? `<div class="listing-img-sold"><span>${t('sold_badge')}</span></div>` : ''}
    </div>`;

  /* Colonne latérale */
  let side = '';
  if (d.is_mine) {
    side = `
      <div class="side-card contact-card">
        <div class="seller-row">
          <span class="avatar avatar-lg">${esc(initials(l.seller.name))}</span>
          <div>
            <strong>${t('own_listing')}</strong>
            <small>${t('listing_by')} ${esc(l.seller.name)} · ${t('member_since')} ${timeAgo(l.seller.since)}</small>
          </div>
        </div>
        <div class="net-box">
          💰 ${t('seller_net_note', { x: money(net), y: money(commission) })}
        </div>
        <div style="display:grid;gap:8px;margin-top:12px">
          <a class="btn btn-ghost" href="edit.html?id=${l.id}">${t('btn_edit')}</a>
          <a class="btn btn-ghost" href="my-listings.html">${t('nav_my_listings')}</a>
        </div>
      </div>`;
  } else {
    side = `
      <div class="side-card contact-card">
        <h3>${t('seller_title')}</h3>
        <div class="seller-row">
          <span class="avatar avatar-lg">${esc(initials(l.seller.name))}</span>
          <div>
            <strong>${esc(l.seller.name)}</strong>
            <small>${l.seller.city ? '📍 ' + esc(l.seller.city) + ' · ' : ''}${t('member_since')} ${timeAgo(l.seller.since)}</small>
          </div>
        </div>
        ${me && l.seller.phone ? `<p class="note">📞 ${t('phone')} : <strong>${esc(l.seller.phone)}</strong></p>` : ''}
        <a class="btn btn-accent btn-block" id="btn-contact" href="#">${t('contact_seller')}</a>
        ${sold ? `<p class="note-small center" style="margin-top:8px">${t('sold_badge')} 🏷️</p>` : ''}
        ${!me ? `<p class="note-small center" style="margin-top:8px"><a href="login.html">${t('login_to_contact')}</a></p>` : ''}
      </div>`;
  }

  host.innerHTML = `
    <div class="listing-grid">
      <div>
        ${imgBox}
        <div class="listing-head">
          <h1>${esc(l.title)}</h1>
          <div class="listing-price">${money(l.price)}</div>
        </div>
        <div class="listing-meta">
          ${l.cat_icon ? `<span class="chip-mini">${l.cat_icon} ${esc(catName || '')}</span>` : ''}
          ${l.city ? `<span class="chip-mini">📍 ${esc(l.city)}</span>` : ''}
          <span class="chip-mini">🕒 ${t('published_on')} ${timeAgo(l.created_at)}</span>
          ${UI.statusChip(l.status)}
        </div>
        <div class="listing-desc">
          <h2>${t('listing_desc')}</h2>
          <p>${esc(l.description).replace(/\n/g, '<br>')}</p>
        </div>
        <div class="safety-box safety-sm">
          <strong>🛡️ ${t('safety_title')} :</strong> ${t('safety_text')}
        </div>
      </div>
      <div>
        ${side}
        ${!d.is_mine ? `<button class="btn btn-ghost btn-block fav-heart-lg heart-big-btn ${d.is_fav ? 'on' : ''}" id="btn-fav">
            ${d.is_fav ? '♥' : '♡'} ${t('add_fav')}
          </button>` : ''}
      </div>
    </div>`;

  /* ----- Contacter le vendeur ----- */
  const contact = $('#btn-contact');
  if (contact) {
    contact.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!me) {
        localStorage.setItem('souk10_after', 'listing.html?id=' + id);
        toast(t('login_required'), 'err');
        setTimeout(() => go('login.html'), 600);
        return;
      }
      contact.disabled = true;
      try {
        const r = await API.post('conversations/start', { listing_id: id });
        go('chat.html?id=' + r.conversation_id);
      } catch (err) {
        contact.disabled = false;
        toast(apiErrorText(err), 'err');
      }
    });
  }

  /* ----- Favori ----- */
  const fav = $('#btn-fav');
  if (fav) {
    fav.addEventListener('click', async () => {
      if (!me) {
        localStorage.setItem('souk10_after', 'listing.html?id=' + id);
        toast(t('login_to_fav'), 'err');
        setTimeout(() => go('login.html'), 600);
        return;
      }
      try {
        const r = await API.post('favorites/toggle', { listing_id: id });
        fav.innerHTML = (r.fav ? '♥' : '♡') + ' ' + t('add_fav');
        fav.classList.toggle('on', r.fav);
        toast(r.fav ? t('fav_added') : t('fav_removed'), 'ok', 2000);
      } catch (err) {
        toast(apiErrorText(err), 'err');
      }
    });
  }

  /* ----- Annonces similaires ----- */
  if (d.similar.length) {
    $('#similar-zone').innerHTML = `
      <div class="sec-head"><h2 class="sec-title">${t('similar')}</h2></div>
      <div class="grid grid-4" id="similar-grid"></div>`;
    UI.renderGrid($('#similar-grid'), d.similar);
  }
})();
