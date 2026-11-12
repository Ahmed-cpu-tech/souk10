/* ============================================================
   Souk10 — api.js : communication avec l'API (fetch + session)
   ============================================================ */
'use strict';

const API = {
  csrf: '',
  me: null,        // utilisateur connecté ou null
  unread: 0,       // messages non lus
  rate: 0.10,      // commission 10%
  _initPromise: null,

  /** Requête GET (params : objet de query string) */
  async get(route, params = {}) {
    return this._request(route, { method: 'GET' }, params);
  },

  /** Requête POST avec corps JSON (params GET optionnels) */
  async post(route, data = {}, params = {}) {
    return this._request(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, params);
  },

  /** Requête POST multipart (upload d'image) */
  async postForm(route, formData) {
    return this._request(route, { method: 'POST', body: formData });
  },

  async _request(route, opts = {}, params = {}) {
    const url = new URL(API_URL, location.origin);
    url.searchParams.set('route', route);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
    opts.credentials = 'same-origin';
    opts.headers = Object.assign({}, opts.headers || {}, { 'X-CSRF-Token': this.csrf });
    let res, j;
    try {
      res = await fetch(url.toString(), opts);
    } catch (e) {
      throw { status: 0, error: 'error_generic' };
    }
    try {
      j = await res.json();
    } catch (e) {
      throw { status: res.status, error: 'server_error' };
    }
    if (!res.ok || !j.ok) {
      throw { status: res.status, error: (j && j.error) || 'error_generic' };
    }
    return j.data;
  },

  /**
   * Démarrage : charge la session, traduit la page, dessine header/footer.
   * À appeler une seule fois par page :  API.init().then(me => ...)
   */
  init() {
    if (this._initPromise) return this._initPromise;
    I18N.apply(); // traduire tout de suite (texte statique)
    this._initPromise = (async () => {
      try {
        const d = await this._request('auth/me', { method: 'GET' });
        this.me = d.user;
        this.csrf = d.csrf;
        this.unread = d.unread;
        this.rate = d.rate || 0.10;
      } catch (e) {
        this.me = null;
      }
      UI.header();
      UI.footer();
      return this.me;
    })();
    return this._initPromise;
  },

  /** Garde : la page exige une connexion. Retourne false + redirige si invité. */
  requireAuth(me) {
    if (me) return true;
    localStorage.setItem('souk10_after', location.pathname.split('/').pop() + location.search);
    toast(t('login_required'), 'err');
    setTimeout(() => go('login.html'), 600);
    return false;
  },

  /** Où aller après login */
  afterLogin() {
    const after = localStorage.getItem('souk10_after');
    localStorage.removeItem('souk10_after');
    go(after || 'index.html');
  },
};
