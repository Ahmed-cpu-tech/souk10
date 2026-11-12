/* ============================================================
   Souk10 — profil public (ou son propre profil sans ?id=)
   ============================================================ */
'use strict';

(async () => {
  const me = await API.init();
  const zone = $('#profile-zone');
  const grid = $('#grid');

  const params = qs();
  let userId = Number(params.get('id') || 0);
  if (!userId) {
    if (!API.requireAuth(me)) return;
    userId = me.id;
  }
  grid.innerHTML = UI.loader();

  let d;
  try {
    d = await API.get('listings/user', { user_id: userId });
  } catch (e) {
    zone.innerHTML = UI.emptyState('😕', 'not_found');
    grid.innerHTML = '';
    return;
  }

  const u = d.user;
  document.title = esc(u.name) + ' — Souk10';
  zone.innerHTML = `
    <div class="profile-head">
      <span class="avatar avatar-xl">${esc(initials(u.name))}</span>
      <div>
        <h1>${t('profile_of')} ${esc(u.name)}</h1>
        <p class="muted">
          ${u.city ? '📍 ' + esc(u.city) + ' · ' : ''}
          ${t('member_since')} ${timeAgo(u.created_at)}
        </p>
        ${u.id === (me && me.id) ? `<p style="margin-top:6px"><a href="my-listings.html">📦 ${t('my_listings')}</a> · <a href="messages.html">💬 ${t('nav_messages')}</a></p>` : ''}
      </div>
    </div>`;

  $('#listings-title').innerHTML = t('listings_from', { n: d.count });

  /* Carte « changer le mot de passe » — uniquement sur son propre profil */
  if (me && u.id === me.id) {
    const pz = $('#password-zone');
    if (pz) {
      pz.innerHTML = `
        <div class="auth-card" style="margin-top:24px">
          <h2 data-i18n="change_password"></h2>
          <form id="pass-form" novalidate>
            <label class="field">
              <span data-i18n="f_current_password"></span>
              <input name="current" type="password" required autocomplete="current-password">
            </label>
            <div class="field-row">
              <label class="field">
                <span data-i18n="f_new_password"></span>
                <input name="password" type="password" required minlength="6" autocomplete="new-password">
              </label>
              <label class="field">
                <span data-i18n="f_new_password2"></span>
                <input name="password2" type="password" required minlength="6" autocomplete="new-password">
              </label>
            </div>
            <button class="btn btn-primary btn-block" type="submit" data-i18n="btn_save"></button>
          </form>
        </div>`;
      I18N.apply();

      $('#pass-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const btn = f.querySelector('button');
        btn.disabled = true;
        try {
          await API.post('auth/password', {
            current:   f.elements.current.value,
            password:  f.elements.password.value,
            password2: f.elements.password2.value,
          });
          toast(t('updated_ok'), 'ok');
          f.reset();
        } catch (err) {
          toast(apiErrorText(err), 'err');
        }
        btn.disabled = false;
      });
    }
  }

  if (!d.items.length) {
    grid.innerHTML = UI.emptyState('📦', 'no_listings');
    return;
  }
  UI.renderGrid(grid, d.items);
})();
