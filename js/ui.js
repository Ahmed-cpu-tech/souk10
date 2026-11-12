/* ============================================================
   Souk10 — ui.js : header, footer, cartes, pagination, favoris
   ============================================================ */
'use strict';

const UI = {
  /* ---------------- Header ---------------- */
  header() {
    const me = API.me;
    const host = $('#site-header');
    if (!host) return;
    const langBtn = I18N.lang === 'ar' ? 'Français' : 'العربية';
    const other = I18N.lang === 'ar' ? 'fr' : 'ar';
    const q = esc(qs().get('q') || '');

    let links = '';
    if (me) {
      links = `
        <a href="create.html" class="btn btn-primary btn-sm">➕ <span>${t('nav_publish')}</span></a>
        <a href="my-listings.html">📦 ${t('nav_my_listings')}</a>
        <a href="favorites.html">♥ ${t('nav_favorites')}</a>
        <a href="messages.html">💬 ${t('nav_messages')}${API.unread > 0 ? ` <span class="badge">${API.unread}</span>` : ''}</a>
        ${me.is_admin ? `<a href="admin.html" class="nav-admin">⚙ ${t('nav_admin')}</a>` : ''}
        <a href="profile.html" class="user-chip"><span class="avatar">${esc(initials(me.name))}</span><span class="user-name">${esc(me.name)}</span></a>
        <a href="#" id="nav-logout" class="nav-logout">⏻ ${t('nav_logout')}</a>`;
    } else {
      links = `
        <a href="login.html">🔑 ${t('nav_login')}</a>
        <a href="register.html" class="btn btn-accent btn-sm">✨ ${t('nav_register')}</a>`;
    }

    host.innerHTML = `
      <div class="topbar">
        <div class="container nav-wrap">
          <a class="brand" href="index.html">
            <span class="brand-logo">S10</span>
            <span class="brand-text">Souk10<small>${t('brand_tag')}</small></span>
          </a>
          <form class="nav-search" action="index.html" method="get" role="search">
            <input name="q" value="${q}" placeholder="${t('search_ph')}" aria-label="search">
            <button type="submit" aria-label="search">🔍</button>
          </form>
          <button class="burger" id="burger" aria-label="menu">☰</button>
          <nav class="nav-links" id="nav-links">${links}
            <a href="#" id="lang-toggle" class="lang-toggle">🌐 ${langBtn}</a>
          </nav>
        </div>
      </div>`;

    $('#burger').addEventListener('click', () => $('#nav-links').classList.toggle('open'));
    $('#lang-toggle').addEventListener('click', (e) => { e.preventDefault(); I18N.setLang(other); });
    const lo = $('#nav-logout');
    if (lo) {
      lo.addEventListener('click', async (e) => {
        e.preventDefault();
        try { await API.post('auth/logout'); } catch (err) { /* session déjà fermée */ }
        toast(t('bye'), 'ok');
        setTimeout(() => go('index.html'), 500);
      });
    }
  },

  /* ---------------- Footer ---------------- */
  footer() {
    const host = $('#site-footer');
    if (!host) return;
    host.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-wrap">
            <div class="footer-brand">
              <strong>Souk10</strong>
              <p>${t('footer_tag')}</p>
              <p>💰 ${t('st_commission')}</p>
            </div>
            <div class="footer-links">
              <a href="index.html">${t('nav_home')}</a>
              <a href="create.html">${t('nav_publish')}</a>
              <a href="favorites.html">${t('nav_favorites')}</a>
              <a href="messages.html">${t('nav_messages')}</a>
            </div>
          </div>
          <div class="footer-bottom">© ${new Date().getFullYear()} Souk10 — ${t('footer_rights')}</div>
        </div>
      </footer>`;
  },

  /* ---------------- Carte annonce ---------------- */
  card(l) {
    const sold = l.status === 'sold';
    return `
      <div class="card">
        <a class="card-img" href="listing.html?id=${l.id}">
          <img loading="lazy" src="${esc(listingImg(l.image))}" alt="${esc(l.title)}" onerror="this.src='${BASE}/img/placeholder.svg'">
        </a>
        ${sold ? `<div class="sold-overlay">${t('sold_badge')}</div>` : ''}
        <button class="heart ${l.is_fav ? 'on' : ''}" data-id="${l.id}" aria-label="${t('add_fav')}">♥</button>
        <div class="card-body">
          <span class="card-price">${money(l.price)}</span>
          <a class="card-title" href="listing.html?id=${l.id}">${esc(l.title)}</a>
          <div class="card-meta">
            ${l.city ? `<span>📍 ${esc(l.city)}</span>` : ''}
            <span>🕒 ${timeAgo(l.created_at)}</span>
          </div>
        </div>
      </div>`;
  },

  /** Rend une grille de cartes + gère les ♥ */
  renderGrid(host, items, { hearts = true } = {}) {
    if (!host) return;
    host.innerHTML = items.map(l => this.card(l)).join('');
    if (hearts) this.bindHearts(host);
  },

  bindHearts(root = document) {
    $$('.heart', root).forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!API.me) {
          toast(t('login_to_fav'), 'err');
          return;
        }
        const id = btn.dataset.id;
        try {
          const d = await API.post('favorites/toggle', { listing_id: Number(id) });
          btn.classList.toggle('on', d.fav);
          toast(d.fav ? t('fav_added') : t('fav_removed'), 'ok', 2000);
          $$('.heart[data-id="' + id + '"]').forEach(b => b.classList.toggle('on', d.fav));
        } catch (err) {
          toast(apiErrorText(err), 'err');
        }
      });
    });
  },

  /* ---------------- Pagination ---------------- */
  pager(host, page, pages, onPage) {
    if (!host) return;
    if (pages <= 1) { host.innerHTML = ''; return; }
    let html = '';
    if (page > 1) html += `<button class="pg" data-p="${page - 1}">‹ ${t('prev')}</button>`;
    for (let p = 1; p <= pages; p++) {
      if (pages > 9 && Math.abs(p - page) > 3 && p !== 1 && p !== pages) {
        if (p === 2 || p === pages - 1) html += `<span class="pg-dots">…</span>`;
        continue;
      }
      html += `<button class="pg ${p === page ? 'cur' : ''}" data-p="${p}">${p}</button>`;
    }
    if (page < pages) html += `<button class="pg" data-p="${page + 1}">${t('next')} ›</button>`;
    host.innerHTML = `<div class="pager">${html}</div>`;
    $$('.pg', host).forEach(b => b.addEventListener('click', () => onPage(Number(b.dataset.p))));
  },

  /* ---------------- États vides ---------------- */
  emptyState(icon, titleKey, subKey = '', btnHtml = '') {
    return `
      <div class="empty-state">
        <div class="empty-ico">${icon}</div>
        <h3>${t(titleKey)}</h3>
        ${subKey ? `<p>${t(subKey)}</p>` : ''}
        ${btnHtml}
      </div>`;
  },

  /* ---------------- Loader ---------------- */
  loader(msgKey = 'loading') {
    return `<div class="loader"><span class="spinner"></span>${t(msgKey)}</div>`;
  },

  /* ---------------- Chip statut ---------------- */
  statusChip(status) {
    return status === 'sold'
      ? `<span class="chip-mini chip-sold">${t('status_sold')}</span>`
      : `<span class="chip-mini chip-ok">${t('status_active')}</span>`;
  },
};
