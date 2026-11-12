/* ============================================================
   Souk10 — config.js : helpers de base (pas de dépendances)
   ============================================================ */
'use strict';

/** URL de base du site (ex: "/souk10-js" ou "") — les pages sont à la racine du dossier */
const BASE = location.pathname.replace(/\/[^/]*$/, '');

/** URL de l'API */
const API_URL = BASE + '/api/index.php';

/** Raccourcis DOM */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Échappement HTML (obligatoire pour tout contenu utilisateur) */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Formatage du prix : 6800 → "6 800 MAD" / "6 800 د.م." */
function money(n) {
  const num = Number(n) || 0;
  const dec = num % 1 ? 2 : 0;
  const txt = num.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return txt + ' ' + t('mad');
}

/** "il y a ..." à partir d'une date MySQL "YYYY-MM-DD HH:MM:SS" */
function timeAgo(mysql) {
  if (!mysql) return '';
  const ts = new Date(String(mysql).replace(' ', 'T'));
  if (isNaN(ts)) return '';
  const diff = Math.max(0, (Date.now() - ts.getTime()) / 1000);
  if (diff < 60)      return t('just_now');
  if (diff < 3600)    return t('ago_min',  { n: Math.floor(diff / 60) });
  if (diff < 86400)   return t('ago_hour', { n: Math.floor(diff / 3600) });
  if (diff < 2592000) return t('ago_day',  { n: Math.floor(diff / 86400) });
  return ts.toLocaleDateString(I18N.lang === 'ar' ? 'ar-MA' : 'fr-FR');
}

function fmtDateTime(mysql) {
  if (!mysql) return '';
  const ts = new Date(String(mysql).replace(' ', 'T'));
  if (isNaN(ts)) return '';
  return ts.toLocaleDateString(I18N.lang === 'ar' ? 'ar-MA' : 'fr-FR') + ' ' +
         ts.toLocaleTimeString(I18N.lang === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Initiales pour l'avatar */
function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/** Paramètres GET de la page courante */
function qs() {
  return new URLSearchParams(location.search);
}

/** Image d'une annonce (avec placeholder) */
function listingImg(image) {
  return image ? BASE + '/uploads/' + encodeURIComponent(image) : BASE + '/img/placeholder.svg';
}

/** Redirection simple */
function go(url) { location.href = url; }

/** Toast (notification en haut) */
function toast(msg, type = 'info', ms = 3500) {
  const box = $('#toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span>' + esc(msg) + '</span>';
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
}

/** Message d'erreur traduit depuis une clé d'API */
function apiErrorText(e) {
  return t(e && e.error ? e.error : 'error_generic');
}
