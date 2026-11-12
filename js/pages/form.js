/* ============================================================
   Souk10 — form.js : publier / modifier une annonce
   (page choisie via <body data-page="create|edit">)
   ============================================================ */
'use strict';

(async () => {
  const me = await API.init();
  const page = document.body.dataset.page;
  if (!API.requireAuth(me)) return;

  const form = $('#listing-form');
  const fileInput = $('#f-image');
  const previewZone = $('#preview-zone');
  const btn = $('#btn-submit');
  let selectedFile = null;   // fichier choisi (ou null)
  let removedOld = false;    // edit : l'utilisateur a retiré l'ancienne photo

  /* ----- Catégories + villes ----- */
  try {
    const cats = await API.get('categories');
    $('#f-cat').innerHTML = `<option value="">—</option>` +
      cats.map(c => `<option value="${c.id}">${c.icon} ${esc(I18N.lang === 'ar' ? c.name_ar : c.name_fr)}</option>`).join('');
  } catch (e) { toast(apiErrorText(e), 'err'); }
  $('#cities-dl').innerHTML = I18N.cities[I18N.lang].map(c => `<option value="${esc(c)}">`).join('');

  /* ----- Upload : clic + aperçu ----- */
  const box = $('#upload-box');
  box.addEventListener('click', () => fileInput.click());
  box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  ['dragover', 'dragleave', 'drop'].forEach(ev =>
    box.addEventListener(ev, (e) => {
      e.preventDefault();
      box.classList.toggle('drag', ev === 'dragover');
      if (ev === 'drop' && e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
      }
    })
  );

  function showPreview(file) {
    if (!file) { previewZone.innerHTML = ''; return; }
    const url = URL.createObjectURL(file);
    previewZone.innerHTML = `
      <div class="upload-preview">
        <img src="${url}" alt="preview">
        <button type="button" class="rm" title="${t('btn_delete')}">✕</button>
      </div>`;
    previewZone.querySelector('.rm').addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      previewZone.innerHTML = '';
      if (page === 'edit') removedOld = true;
    });
  }

  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast(t('err_image_too_big'), 'err'); fileInput.value = ''; return; }
    selectedFile = f;
    removedOld = false;
    showPreview(f);
  });

  /* ----- Mode édition : pré-remplir ----- */
  let listingId = null;
  if (page === 'edit') {
    listingId = Number(qs().get('id') || 0);
    if (!listingId) { go('my-listings.html'); return; }
    try {
      const d = await API.get('listings/show', { id: listingId });
      if (!d.is_mine) { toast(t('not_allowed'), 'err'); setTimeout(() => go('index.html'), 800); return; }
      const l = d.listing;
      form.elements.title.value = l.title;
      form.elements.description.value = l.description || '';
      form.elements.price.value = l.price;
      form.elements.city.value = l.city || '';
      $('#f-cat').value = l.category_id || '';
      if (l.image) {
        $('#current-img-zone').innerHTML = `
          <div class="current-img">
            <img src="${esc(listingImg(l.image))}" alt="${esc(l.title)}">
            <button type="button" class="btn btn-danger btn-sm" id="rm-old">${t('btn_delete')} 📷</button>
          </div>`;
        $('#rm-old').addEventListener('click', () => {
          removedOld = true;
          $('#current-img-zone').innerHTML = '';
        });
      }
    } catch (e) {
      toast(apiErrorText(e), 'err');
      setTimeout(() => go('my-listings.html'), 900);
      return;
    }
  }

  /* ----- Soumission ----- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = form.elements.title.value.trim();
    const price = parseFloat(form.elements.price.value);
    if (!title || title.length < 3) { toast(t('err_title_len'), 'err'); return; }
    if (!price || price <= 0) { toast(t('err_price'), 'err'); return; }
    if (!form.elements.category_id.value) { toast(t('err_fill'), 'err'); return; }

    const fd = new FormData();
    fd.append('title', title);
    fd.append('description', form.elements.description.value.trim());
    fd.append('price', String(price));
    fd.append('category_id', form.elements.category_id.value);
    fd.append('city', form.elements.city.value.trim());
    if (selectedFile) fd.append('image', selectedFile);

    btn.disabled = true;
    try {
      if (page === 'create') {
        const r = await API.postForm('listings', fd);
        toast(t('created_ok'), 'ok');
        setTimeout(() => go('listing.html?id=' + r.id), 700);
      } else {
        fd.append('id', String(listingId));
        if (removedOld && !selectedFile) fd.append('remove_image', '1');
        await API.postForm('listings/update', fd);
        toast(t('updated_ok'), 'ok');
        setTimeout(() => go('listing.html?id=' + listingId), 700);
      }
    } catch (err) {
      btn.disabled = false;
      toast(apiErrorText(err), 'err');
    }
  });
})();
