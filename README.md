# Souk10 — السوق المغربي أونلاين 🛍️

Site dyal marketplace (bii9 w chri) b **HTML / CSS / JavaScript** + **MySQL**, khdam 3la **XAMPP**.

## ⚙️ L'architecture (muhim tfehm!)

```
Navigateur (Chrome)                      Serveur XAMPP
┌───────────────────────────┐            ┌────────────────────────────┐
│  Pages .html              │            │  api/index.php  (API sghira)│
│  Design .css              │  ──fetch──▶│       ↕                     │
│  Logique .js              │            │  MySQL (base souk10)        │
│  (koulchi l'site hna!)    │            │  uploads/ (tsawer)          │
└───────────────────────────┘            └────────────────────────────┘
```

- **Koulchi l'site houwa HTML/CSS/JS** : les pages kaml `.html`, l'design f `css/style.css`, w l'logique kaml f `js/`.
- L'navigateur **ma y9derch yhder m3a MySQL nichan** — 3lach kayn ghir **2 fichiers sghar PHP** f `api/` (khasshom XAMPP, homa li kay-wsslo JS l la base). Ma kayn 7ta page PHP f l'site.
- L'messages w les sessions khadamin b AJAX (fetch), l'chat kay-t'actualisa bou7do kol 3.5 secondes.

## 🚀 Installation f XAMPP (5 d9ay9)

1. **Copier** le dossier `souk10-js` kaml f : `C:\xampp\htdocs\`
   → ghadi ykoun 3ndek `C:\xampp\htdocs\souk10-js\`
2. **7el XAMPP Control Panel** w chghel : **Apache** ✅ w **MySQL** ✅
3. **Importi la base** : 7el `http://localhost/phpmyadmin` → دخل l'onglet **Importer** → khtar fichier `sql/souk10.sql` → Exécuter
4. **7el l'site** : `http://localhost/souk10-js`

Mbruk! 🎉

## 👑 Les comptes

| Role | Email | Mot de passe |
|---|---|---|
| **Admin** | `admin@souk10.ma` | `admin123` |
| Vendeur démo | `seller@souk10.ma` | `seller123` |

> ⚠️ **Beddel mot de passe dyal admin** mn awal marra ! dkhel b `admin@souk10.ma` / `admin123` → sir l **profil dyalk** (`profile.html`) → carte **« بدل كلمة السر / Changer le mot de passe »** → dkhel l'mot de passe l'9dim (`admin123`) w l'jdid.
>
> 💡 Kol user y-9der ybeddel mot de passe dyalo mn profil dyalo (kay-tlbeso l'9dim bach y2akkedhoum).

## ✨ Les fonctions

- 📢 **Publier des annonces** b photo (JPG/PNG/WEBP, 5 Mo max) w prix
- 🔎 **Recherche + filtres** : categorie, ville, prix min/max, tri, pagination
- 💬 **Chat** bin l'buyer w l'seller (temps réel, AJAX)
- ♥ **Favoris**
- 👤 **Profils vendeurs** + les annonces dyalhom
- 🔑 **Beddel mot de passe** mn l'profil (kay-tverifi l'9dim, l'jdid 6 7orouf 3la l'9el)
- 💰 **Commission 10%** : ml'i tchri l'sel3a → l'admin kay-tsajl l'commission oryomatikian (l'seller kay-wssel 90%)
- ⚙️ **Panel Admin** : statistiques, gérer les annonces (vendue/active/supprimer), les users (admin/supprimer), **rapport des commissions** (total + ce mois), w lire les conversations (read-only)
- 🌐 **3arbiya 🇲🇦 (RTL) + Français 🇫🇷** — bouton dyal tabdil f l'header
- 📱 Responsive (mobile)

## 📂 Structure

```
souk10-js/
├── *.html            ← les pages (index, listing, create, chat, admin...)
├── css/style.css     ← l'design kaml
├── js/
│   ├── config.js     ← helpers (money, esc, toast...)
│   ├── i18n.js       ← traductions AR/FR
│   ├── api.js        ← l'communication m3a l'API (fetch + CSRF)
│   ├── ui.js         ← header, footer, cartes, pagination
│   └── pages/        ← JS dyal kol page
├── api/
│   ├── config.php    ← connexion MySQL (XAMPP: root, bla mot de passe)
│   └── index.php     ← l'API kaml (routes JSON)
├── sql/souk10.sql    ← la base de données (importé f phpMyAdmin)
├── uploads/          ← tsawer dyal les annonces
└── img/              ← logo + placeholder
```

## 🔧 Ila w9e3 chi mochkil

| Mochkil | L'7al |
|---|---|
| Page blanca / erreur DB | Chouf MySQL khdam f XAMPP Control Panel (vert ✅) |
| `db_error` f l'API | Importi `sql/souk10.sql` f phpMyAdmin |
| Les photos ma kaynch | Verifier que `uploads/` y-9der ykteb (permissions) |
| Site f sous-dossier akhor | Ma mochkil — l'URLs auto-adaptatives, khdem b nefs l'tari9a |

## 🔐 Sécurité (déjà mawjouda)

- Mots de passe m-chiffrin b **bcrypt**
- **PDO prepared statements** (bla SQL injection)
- **CSRF token** f koul operation
- **XSS** : koulchi m-échappé (esc())
- Upload : verification `getimagesize` + 5 Mo + `.htaccess` kay-mane PHP f `uploads/`
- Admin : koulchi m7mi (401/403 f l'API)
