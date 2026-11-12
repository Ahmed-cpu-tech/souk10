/* ============================================================
   Souk10 — auth.js : connexion + inscription
   (page choisie via <body data-page="login|register">)
   ============================================================ */
'use strict';

(async () => {
  const me = await API.init();
  const page = document.body.dataset.page;

  /* Déjà connecté ? → accueil */
  if (me) { go('index.html'); return; }

  /* Datalist des villes (inscription) */
  const dl = $('#cities-dl');
  if (dl) dl.innerHTML = I18N.cities[I18N.lang].map(c => `<option value="${esc(c)}">`).join('');

  const form = $('#auth-form');
  const btn = $('#btn-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;

    try {
      if (page === 'login') {
        await API.post('auth/login', {
          email: form.elements.email.value.trim(),
          password: form.elements.password.value,
        });
        toast(t('welcome_ok'), 'ok');
        setTimeout(() => API.afterLogin(), 500);
      } else {
        const pass = form.elements.password.value;
        if (pass !== form.elements.password2.value) {
          toast(t('err_pass_match'), 'err');
          btn.disabled = false;
          return;
        }
        await API.post('auth/register', {
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          password: pass,
          password2: form.elements.password2.value,
          phone: form.elements.phone ? form.elements.phone.value.trim() : '',
          city: form.elements.city ? form.elements.city.value.trim() : '',
        });
        toast(t('welcome_ok'), 'ok');
        setTimeout(() => API.afterLogin(), 500);
      }
    } catch (err) {
      btn.disabled = false;
      toast(apiErrorText(err), 'err');
    }
  });
})();
