/* ============================================================
   Souk10 — liste des conversations
   ============================================================ */
'use strict';

(async () => {
  const me = await API.init();
  if (!API.requireAuth(me)) return;

  const host = $('#conv-list');
  host.innerHTML = UI.loader();

  let convs;
  try {
    convs = await API.get('conversations');
  } catch (e) {
    host.innerHTML = UI.emptyState('⚠️', 'error_generic');
    return;
  }

  if (!convs.length) {
    host.innerHTML = UI.emptyState('💬', 'inbox_empty', '', `<a class="btn btn-primary" href="index.html">${t('nav_home')}</a>`);
    return;
  }

  host.innerHTML = convs.map(c => `
    <a class="conv-row" href="chat.html?id=${c.id}">
      <img class="conv-thumb" src="${esc(listingImg(c.listing_image))}" alt="" onerror="this.src='${BASE}/img/placeholder.svg'">
      <div class="conv-info">
        <div class="conv-top">
          <strong>${esc(c.other_name)}</strong>
          ${c.unread > 0 ? `<span class="badge">${c.unread}</span>` : ''}
          <span class="conv-time">${timeAgo(c.last_time)}</span>
        </div>
        <div class="conv-about">${t('about')} : ${esc(c.listing_title)} — <b class="price">${money(c.listing_price)}</b></div>
        <div class="conv-last">${esc(c.last_body || '…')}</div>
      </div>
    </a>`).join('');
})();
