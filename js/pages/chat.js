/* ============================================================
   Souk10 — chat : messages temps réel (polling 3.5s)
   L'admin peut consulter en lecture seule (admin/messages)
   ============================================================ */
'use strict';

(async () => {
  const me = await API.init();
  if (!API.requireAuth(me)) return;

  const convId = Number(qs().get('id') || 0);
  const layout = $('#chat-layout');
  if (!convId) { layout.innerHTML = UI.emptyState('😕', 'not_found'); return; }

  let info = null;       // listing + participants (1er chargement)
  let lastId = 0;
  let canWrite = false;
  let readonlyNote = '';
  let pollTimer = null;

  /* ----- 1er chargement ----- */
  try {
    const d = await API.get('messages', { conversation_id: convId, after: 0 });
    info = d;
    canWrite = true;
    lastId = Math.max(0, ...d.messages.map(m => m.id));
  } catch (e) {
    if (me.is_admin) {
      try {
        const d = await API.get('admin/messages', { conversation_id: convId });
        info = d;
        canWrite = d.is_participant;
        readonlyNote = t('admin_readonly');
        lastId = Math.max(0, ...d.messages.map(m => m.id));
      } catch (e2) {
        layout.innerHTML = UI.emptyState('🚫', 'not_found');
        return;
      }
    } else {
      layout.innerHTML = UI.emptyState('🚫', 'not_allowed', '', `<a class="btn btn-ghost" href="messages.html">${t('back')}</a>`);
      return;
    }
  }

  const l = info.listing;
  const other = (info.buyer.id === me.id) ? info.seller : info.buyer;
  document.title = esc(other.name) + ' — Souk10';

  const sideHtml = `
    <div class="chat-listing">
      <a class="cl-item" href="listing.html?id=${l.id}">
        <img src="${esc(listingImg(l.image))}" alt="" onerror="this.src='${BASE}/img/placeholder.svg'">
        <div>
          <small class="muted">${t('about')}</small>
          <strong>${esc(l.title)}</strong>
          <span class="price" style="font-weight:800">${money(l.price)}</span>
        </div>
      </a>
      <div class="cl-participants">
        <div>🛒 <strong>${esc(info.buyer.name)}</strong> <span class="muted">(${t('tbl_buyer')})</span></div>
        <div>🏷️ <strong>${esc(info.seller.name)}</strong> <span class="muted">(${t('tbl_seller')})</span></div>
      </div>
    </div>`;

  layout.innerHTML = `
    ${sideHtml}
    <div class="chat-main">
      <div class="chat-head">
        <span class="avatar">${esc(initials(other.name))}</span>
        <div>
          <strong>${t('conv_with')} ${esc(other.name)}</strong>
          <div class="muted" style="font-size:12px">${t('about')} : ${esc(l.title)}</div>
        </div>
      </div>
      <div class="chat-box" id="chat-box"></div>
      ${canWrite ? `
        <form class="chat-form" id="chat-form">
          <input id="chat-input" autocomplete="off" maxlength="2000" data-i18n-ph="msg_ph">
          <button class="btn btn-primary" type="submit">${t('btn_send')} ➤</button>
        </form>` : `
        <div class="chat-disabled ${readonlyNote ? 'chat-readonly' : ''}">
          ${readonlyNote ? '👁 ' + readonlyNote : t('sold_badge') + ' 🏷️'}
        </div>`}
    </div>`;

  const box = $('#chat-box');

  /* ----- Affichage d'un message ----- */
  function appendMsg(m, scroll = true) {
    const empty = box.querySelector('.chat-empty');
    if (empty) empty.remove();
    const div = document.createElement('div');
    div.className = 'msg ' + (m.mine ? 'me' : 'other');
    const senderName = !m.mine
      ? (m.sender_name || (m.sender_id === info.buyer.id ? info.buyer.name : info.seller.name) || t('deleted_user'))
      : '';
    div.innerHTML = `
      ${senderName ? `<div class="msg-sender">${esc(senderName)}</div>` : ''}
      <div class="bubble">${esc(m.body).replace(/\n/g, '<br>')}</div>
      <div class="msg-time">${fmtDateTime(m.created_at)}</div>`;
    box.appendChild(div);
    if (scroll) box.scrollTop = box.scrollHeight;
  }

  if (!info.messages.length) {
    box.innerHTML = `<div class="chat-empty">${t('no_messages_yet')} 👋</div>`;
  } else {
    info.messages.forEach(m => appendMsg(m, false));
    box.scrollTop = box.scrollHeight;
  }

  /* ----- Polling ----- */
  async function poll() {
    if (document.hidden || !lastId) return;
    try {
      const d = await API.get('messages', { conversation_id: convId, after: lastId });
      if (d.messages.length) {
        d.messages.forEach(m => appendMsg(m));
        lastId = Math.max(lastId, ...d.messages.map(m => m.id));
      }
    } catch (e) { /* silence : réseau / session */ }
  }
  pollTimer = setInterval(poll, 3500);

  /* ----- Envoi ----- */
  const form = $('#chat-form');
  if (form) {
    const input = $('#chat-input');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = input.value.trim();
      if (!body) { toast(t('empty_msg'), 'err'); return; }
      const sendBtn = form.querySelector('button');
      sendBtn.disabled = true;
      try {
        const m = await API.post('messages/send', { conversation_id: convId, body });
        appendMsg(m);
        lastId = Math.max(lastId, m.id);
        input.value = '';
        input.focus();
      } catch (err) {
        toast(apiErrorText(err), 'err');
      } finally {
        sendBtn.disabled = false;
      }
    });
    input.focus();
  }
})();
