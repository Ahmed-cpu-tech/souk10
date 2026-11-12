/* ============================================================
   Souk10 — admin.js : tableau de bord, annonces, utilisateurs,
   commissions (10%), messagerie (lecture seule)
   ============================================================ */
'use strict';

(async () => {
  const me = await API.init();
  if (!me) {
    localStorage.setItem('souk10_after', 'admin.html');
    toast(t('login_required'), 'err');
    setTimeout(() => go('login.html'), 600);
    return;
  }
  if (!me.is_admin) {
    toast(t('admin_required'), 'err');
    setTimeout(() => go('index.html'), 800);
    return;
  }

  const pane = $('#admin-pane');
  let curTab = 'dashboard';

  const statCard = (label, value, cls = '') =>
    `<div class="stat-card ${cls}"><b>${value}</b><span>${esc(label)}</span></div>`;

  /* ================= Dashboard ================= */
  async function tabDashboard() {
    pane.innerHTML = UI.loader();
    const d = await API.get('admin/stats');
    const s = d.stats;

    pane.innerHTML = `
      <div class="stat-grid">
        ${statCard(t('st_users'), s.users)}
        ${statCard(t('st_listings'), s.listings)}
        ${statCard(t('st_active'), s.active)}
        ${statCard(t('st_sold'), s.sales)}
        ${statCard(t('st_commission'), money(s.commission), 'sc-orange')}
        ${statCard(t('st_commission_m'), money(s.commission_month), 'sc-blue')}
        ${statCard(t('st_messages'), s.messages)}
      </div>

      <div class="sec-head"><h2 class="sec-title">${t('latest_sales')}</h2></div>
      ${s.sales === 0
        ? `<div class="empty-state" style="padding:22px"><p style="margin:0">${t('no_sales')}</p></div>`
        : `<div class="table-wrap"><table class="table">
            <thead><tr><th>${t('tbl_title')}</th><th>${t('tbl_seller')}</th><th>${t('tbl_price')}</th><th>${t('tbl_commission')}</th><th>${t('tbl_date')}</th></tr></thead>
            <tbody>${d.latest_sales.map(v => `
              <tr>
                <td><a href="listing.html?id=${v.listing_id ?? ''}">${esc(v.title)}</a></td>
                <td>${esc(v.seller)}</td>
                <td>${money(v.final_price)}</td>
                <td class="commission" style="font-weight:800">+${money(v.commission)}</td>
                <td>${fmtDateTime(v.created_at)}</td>
              </tr>`).join('')}
            </tbody></table></div>`}

      <div class="two-col">
        <div>
          <div class="sec-head"><h2 class="sec-title">${t('latest_users')}</h2></div>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>${t('tbl_user')}</th><th>${t('tbl_joined')}</th></tr></thead>
            <tbody>${d.latest_users.map(u => `
              <tr><td>${esc(u.name)}${u.is_admin ? ` <span class="chip-mini chip-admin">${t('admin_badge')}</span>` : ''}<br><small class="muted">${esc(u.email)}</small></td>
              <td>${timeAgo(u.created_at)}</td></tr>`).join('')}
            </tbody></table></div>
        </div>
        <div>
          <div class="sec-head"><h2 class="sec-title">${t('latest_listings')}</h2></div>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>${t('tbl_title')}</th><th>${t('tbl_price')}</th><th>${t('tbl_status')}</th></tr></thead>
            <tbody>${d.latest_listings.map(l => `
              <tr><td><div class="td-title"><img class="row-thumb" src="${esc(listingImg(l.image))}" onerror="this.src='${BASE}/img/placeholder.svg'" alt="">${esc(l.title)}</div></td>
              <td>${money(l.price)}</td><td>${UI.statusChip(l.status)}</td></tr>`).join('')}
            </tbody></table></div>
        </div>
      </div>`;
  }

  /* ================= Annonces ================= */
  async function tabListings(q = '', status = '') {
    pane.innerHTML = `
      <div class="filter-bar">
        <input id="al-q" placeholder="${t('search_ph')}" value="${esc(q)}">
        <select id="al-status">
          <option value="">${t('filters_all')}</option>
          <option value="active" ${status === 'active' ? 'selected' : ''}>${t('status_active')}</option>
          <option value="sold" ${status === 'sold' ? 'selected' : ''}>${t('status_sold')}</option>
        </select>
        <button class="btn btn-primary" id="al-search">${t('search')}</button>
      </div>
      <div id="al-table">${UI.loader()}</div>`;

    const load = async () => {
      const qq = $('#al-q').value.trim();
      const st = $('#al-status').value;
      const items = await API.get('admin/listings', { q: qq, status: st });
      $('#al-table').innerHTML = !items.length
        ? UI.emptyState('📦', 'no_results')
        : `<div class="table-wrap"><table class="table">
            <thead><tr><th>${t('tbl_title')}</th><th>${t('tbl_seller')}</th><th>${t('tbl_category')}</th><th>${t('tbl_price')}</th><th>${t('tbl_status')}</th><th>${t('tbl_actions')}</th></tr></thead>
            <tbody>${items.map(l => `
              <tr>
                <td><div class="td-title"><img class="row-thumb" src="${esc(listingImg(l.image))}" onerror="this.src='${BASE}/img/placeholder.svg'" alt=""><a href="listing.html?id=${l.id}">${esc(l.title)}</a></div></td>
                <td>${esc(l.seller)}</td>
                <td>${esc(I18N.lang === 'ar' ? (l.cat_ar || '—') : (l.cat_fr || '—'))}</td>
                <td>${money(l.price)}</td>
                <td>${UI.statusChip(l.status)}</td>
                <td><div class="td-actions">
                  ${l.status === 'sold'
                    ? `<button class="btn btn-ghost btn-xs act" data-id="${l.id}" data-act="reopen">${t('btn_reopen')}</button>`
                    : `<button class="btn btn-success btn-xs act" data-id="${l.id}" data-act="sold">${t('btn_sold')}</button>`}
                  <button class="btn btn-danger btn-xs act" data-id="${l.id}" data-act="delete">${t('btn_delete')}</button>
                </div></td>
              </tr>`).join('')}
            </tbody></table></div>`;

      $$('#al-table .act').forEach(b => b.addEventListener('click', async () => {
        const id = Number(b.dataset.id);
        const act = b.dataset.act;
        if (act === 'delete' && !confirm(t('confirm_delete'))) return;
        b.disabled = true;
        try {
          await API.post('admin/listing-action', { id, action: act });
          toast(act === 'sold' ? t('sold_ok_admin') : act === 'reopen' ? t('reopen_ok') : t('deleted_ok'), 'ok');
          load();
        } catch (e) { b.disabled = false; toast(apiErrorText(e), 'err'); }
      }));
    };

    $('#al-search').addEventListener('click', load);
    $('#al-q').addEventListener('keydown', e => { if (e.key === 'Enter') load(); });
    $('#al-status').addEventListener('change', load);
    await load();
  }

  /* ================= Utilisateurs ================= */
  async function tabUsers(q = '') {
    pane.innerHTML = `
      <div class="filter-bar">
        <input id="au-q" placeholder="${t('search_ph')}" value="${esc(q)}">
        <button class="btn btn-primary" id="au-search">${t('search')}</button>
      </div>
      <div id="au-table">${UI.loader()}</div>`;

    const load = async () => {
      const items = await API.get('admin/users', { q: $('#au-q').value.trim() });
      $('#au-table').innerHTML = !items.length
        ? UI.emptyState('👥', 'no_results')
        : `<div class="table-wrap"><table class="table">
            <thead><tr><th>${t('tbl_user')}</th><th>${t('city')}</th><th>${t('tbl_count')}</th><th>${t('tbl_joined')}</th><th>${t('tbl_actions')}</th></tr></thead>
            <tbody>${items.map(u => `
              <tr>
                <td>${esc(u.name)} ${u.is_admin ? `<span class="chip-mini chip-admin">${t('admin_badge')}</span>` : ''}<br><small class="muted">${esc(u.email)}</small></td>
                <td>${esc(u.city || '—')}</td>
                <td>${u.cnt}</td>
                <td>${fmtDateTime(u.created_at)}</td>
                <td><div class="td-actions">
                  ${u.is_admin
                    ? `<button class="btn btn-ghost btn-xs act" data-id="${u.id}" data-act="remove_admin">${t('btn_remove_admin')}</button>`
                    : `<button class="btn btn-ghost btn-xs act" data-id="${u.id}" data-act="toggle_admin">${t('btn_make_admin')}</button>
                       <button class="btn btn-danger btn-xs act" data-id="${u.id}" data-act="delete">${t('btn_delete')}</button>`}
                </div></td>
              </tr>`).join('')}
            </tbody></table></div>`;

      $$('#au-table .act').forEach(b => b.addEventListener('click', async () => {
        const id = Number(b.dataset.id);
        const act = b.dataset.act;
        if (act === 'delete' && !confirm(t('confirm_user_del'))) return;
        b.disabled = true;
        try {
          await API.post('admin/user-action', { id, action: act });
          toast(act === 'toggle_admin' ? t('admin_now') : act === 'remove_admin' ? t('admin_removed') : t('user_deleted'), 'ok');
          load();
        } catch (e) { b.disabled = false; toast(apiErrorText(e), 'err'); }
      }));
    };

    $('#au-search').addEventListener('click', load);
    $('#au-q').addEventListener('keydown', e => { if (e.key === 'Enter') load(); });
    await load();
  }

  /* ================= Commissions ================= */
  async function tabCommissions() {
    pane.innerHTML = UI.loader();
    const d = await API.get('admin/commissions');
    pane.innerHTML = `
      <div class="safety-box" style="margin-top:0">💡 ${t('commission_note')}</div>
      <div class="stat-grid">
        ${statCard(t('total_all'), money(d.total), 'sc-orange')}
        ${statCard(t('st_commission_m'), money(d.month), 'sc-blue')}
        ${statCard(t('sales_count'), d.count)}
        ${statCard(t('avg_price'), money(d.avg))}
      </div>
      ${!d.sales.length
        ? UI.emptyState('💰', 'no_sales')
        : `<div class="table-wrap"><table class="table">
            <thead><tr><th>${t('tbl_title')}</th><th>${t('tbl_seller')}</th><th>${t('tbl_price')}</th><th>${t('tbl_commission')}</th><th>${t('tbl_date')}</th></tr></thead>
            <tbody>${d.sales.map(s => `
              <tr>
                <td>${esc(s.title)}</td>
                <td>${esc(s.seller)}</td>
                <td>${money(s.final_price)}</td>
                <td class="commission" style="font-weight:800">+${money(s.commission)}</td>
                <td>${fmtDateTime(s.created_at)}</td>
              </tr>`).join('')}
            </tbody></table></div>`}`;
  }

  /* ================= Messagerie (lecture seule) ================= */
  async function tabMessages() {
    pane.innerHTML = UI.loader();
    const convs = await API.get('admin/conversations');
    if (!convs.length) {
      pane.innerHTML = UI.emptyState('💬', 'inbox_empty');
      return;
    }
    pane.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>${t('tbl_title')}</th><th>${t('tbl_buyer')}</th><th>${t('tbl_seller')}</th><th>${t('st_messages')}</th><th>${t('tbl_date')}</th><th>${t('tbl_actions')}</th></tr></thead>
        <tbody>${convs.map(c => `
          <tr>
            <td><div class="td-title"><img class="row-thumb" src="${esc(listingImg(c.image))}" onerror="this.src='${BASE}/img/placeholder.svg'" alt="">${esc(c.title)}</div></td>
            <td>${esc(c.buyer)}</td>
            <td>${esc(c.seller)}</td>
            <td>${c.msg_count}</td>
            <td>${c.last_time ? timeAgo(c.last_time) : '—'}</td>
            <td><button class="btn btn-ghost btn-xs view-convo" data-id="${c.id}">${t('view_convo')}</button></td>
          </tr>`).join('')}
        </tbody></table></div>
      <div id="convo-view" style="margin-top:18px"></div>`;

    $$('.view-convo', pane).forEach(b => b.addEventListener('click', async () => {
      const id = Number(b.dataset.id);
      const zone = $('#convo-view');
      zone.innerHTML = UI.loader();
      try {
        const d = await API.get('admin/messages', { conversation_id: id });
        zone.innerHTML = `
          <div class="chat-main" style="height:520px">
            <div class="chat-head">
              <strong>${t('about')} : ${esc(d.listing.title)}</strong>
              <span class="muted" style="margin-inline-start:auto">🛒 ${esc(d.buyer.name)} ⇄ 🏷️ ${esc(d.seller.name)}</span>
            </div>
            <div class="chat-box">
              ${d.messages.length ? d.messages.map(m => {
                const name = m.sender_name || (m.sender_id === d.buyer.id ? d.buyer.name : m.sender_id === d.seller.id ? d.seller.name : t('deleted_user'));
                return `<div class="msg ${m.mine ? 'me' : 'other'}">
                          ${m.mine ? '' : `<div class="msg-sender">${esc(name)}</div>`}
                          <div class="bubble">${esc(m.body).replace(/\n/g, '<br>')}</div>
                          <div class="msg-time">${fmtDateTime(m.created_at)}</div>
                        </div>`;
              }).join('') : `<div class="chat-empty">${t('no_messages_yet')}</div>`}
            </div>
            <div class="chat-readonly">👁 ${t('admin_readonly')}</div>
          </div>`;
        const bx = zone.querySelector('.chat-box');
        bx.scrollTop = bx.scrollHeight;
      } catch (e) {
        zone.innerHTML = UI.emptyState('⚠️', 'error_generic');
      }
    }));
  }

  /* ================= Navigation par onglets ================= */
  const renderers = {
    dashboard: tabDashboard,
    listings: () => tabListings(),
    users: () => tabUsers(),
    commissions: tabCommissions,
    messages: tabMessages,
  };

  async function switchTab(tab) {
    curTab = tab;
    $$('#admin-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    pane.innerHTML = UI.loader();
    try {
      await renderers[tab]();
    } catch (e) {
      pane.innerHTML = UI.emptyState('⚠️', apiErrorText(e));
      if (e.status === 403) { /* plus admin ? */ }
    }
  }

  $$('#admin-tabs button').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  await switchTab('dashboard');
})();
