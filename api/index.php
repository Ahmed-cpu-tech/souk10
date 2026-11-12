<?php
declare(strict_types=1);

/**
 * Souk10 — API (routeur unique)
 * Tous les appels JavaScript passent ici :  api/index.php?route=...
 *
 * Réponses : { ok: true, data: ... }  ou  { ok: false, error: "clé_traduction" }
 */

require __DIR__ . '/config.php';

$route  = (string)($_GET['route'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/* ---------- Lecture du corps des requêtes POST ---------- */
$in = [];
if ($method === 'POST') {
    $ct = (string)($_SERVER['CONTENT_TYPE'] ?? '');
    if (stripos($ct, 'multipart/form-data') !== false || stripos($ct, 'application/x-www-form-urlencoded') !== false) {
        $in = $_POST;
    } else {
        $raw = file_get_contents('php://input');
        $dec = json_decode($raw ?: '[]', true);
        $in  = is_array($dec) ? $dec : [];
    }
}

/** Valeur texte du corps de la requête */
function val(array $in, string $key, string $default = ''): string
{
    $v = $in[$key] ?? $default;
    return is_scalar($v) ? trim((string)$v) : $default;
}

/** Valeur entière */
function val_int(array $in, string $key, int $default = 0): int
{
    $v = $in[$key] ?? null;
    return is_numeric($v) ? (int)$v : $default;
}

/* ============================================================
   Handlers
   ============================================================ */

function me_payload(): never
{
    $u = current_user();
    api_json([
        'ok'   => true,
        'data' => [
            'user'    => $u ? safe_user($u) : null,
            'csrf'    => csrf_token(),
            'unread'  => $u ? unread_total((int)$u['id']) : 0,
            'rate'    => COMMISSION_RATE,
        ],
    ]);
}

/* ---------------- AUTH ---------------- */

function auth_register(array $in): never
{
    $name  = val($in, 'name');
    $email = mb_strtolower(val($in, 'email'));
    $pass  = (string)($in['password'] ?? '');
    $pass2 = (string)($in['password2'] ?? '');
    $phone = val($in, 'phone') ?: null;
    $city  = val($in, 'city') ?: null;

    if ($name === '') {
        err('err_name');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        err('err_email_format');
    }
    if (mb_strlen($pass) < 6) {
        err('err_pass_len');
    }
    if ($pass !== $pass2) {
        err('err_pass_match');
    }
    $st = db()->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $st->execute([$email]);
    if ($st->fetch()) {
        err('err_email_taken');
    }
    $st = db()->prepare('INSERT INTO users (name, email, password, phone, city) VALUES (?,?,?,?,?)');
    $st->execute([$name, $email, password_hash($pass, PASSWORD_BCRYPT), $phone, $city]);
    $id = (int)db()->lastInsertId();

    session_regenerate_id(true);
    $_SESSION['user_id'] = $id;
    me_payload();
}

function auth_login(array $in): never
{
    $email = mb_strtolower(val($in, 'email'));
    $pass  = (string)($in['password'] ?? '');
    $st = db()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
    $st->execute([$email]);
    $u = $st->fetch();
    if (!$u || !password_verify($pass, (string)$u['password'])) {
        err('err_credentials', 401);
    }
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$u['id'];
    me_payload();
}

function auth_logout(): never
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    api_json(['ok' => true]);
}

function auth_password(array $in): never
{
    $me    = require_login();
    $cur   = (string)($in['current'] ?? '');
    $pass  = (string)($in['password'] ?? '');
    $pass2 = (string)($in['password2'] ?? '');

    if ($cur === '') {
        err('err_current_pass');
    }
    if (mb_strlen($pass) < 6) {
        err('err_pass_len');
    }
    if ($pass !== $pass2) {
        err('err_pass_match');
    }
    if ($pass === $cur) {
        err('err_pass_same');
    }

    $st = db()->prepare('SELECT password FROM users WHERE id = ? LIMIT 1');
    $st->execute([(int)$me['id']]);
    $u = $st->fetch();
    if (!$u || !password_verify($cur, (string)$u['password'])) {
        err('err_current_pass', 403);
    }

    $st = db()->prepare('UPDATE users SET password = ? WHERE id = ?');
    $st->execute([password_hash($pass, PASSWORD_BCRYPT), (int)$me['id']]);
    api_json(['ok' => true, 'data' => ['changed' => true]]);
}

/* ---------------- CATÉGORIES ---------------- */

function categories_list(): never
{
    $rows = db()->query(
        'SELECT c.id, c.name_ar, c.name_fr, c.icon, COUNT(l.id) AS cnt
         FROM categories c
         LEFT JOIN listings l ON l.category_id = c.id AND l.status = "active"
         GROUP BY c.id ORDER BY c.id'
    )->fetchAll();
    foreach ($rows as &$r) {
        $r['id']  = (int)$r['id'];
        $r['cnt'] = (int)$r['cnt'];
    }
    api_json(['ok' => true, 'data' => $rows]);
}

/* ---------------- ANNONCES ---------------- */

/** Filtre partagé : WHERE pour la liste publique */
function listing_where(array $g): array
{
    $w = ['l.status = "active"'];
    $p = [];
    $q = val($g, 'q');
    if ($q !== '') {
        $w[] = '(l.title LIKE :q1 OR l.description LIKE :q2)';
        $p[':q1'] = '%' . $q . '%';
        $p[':q2'] = '%' . $q . '%';
    }
    if (!empty($g['category'])) {
        $w[] = 'l.category_id = :cat';
        $p[':cat'] = val_int($g, 'category');
    }
    $city = val($g, 'city');
    if ($city !== '') {
        $w[] = 'l.city LIKE :city';
        $p[':city'] = '%' . $city . '%';
    }
    if (isset($g['min']) && $g['min'] !== '') {
        $w[] = 'l.price >= :pmin';
        $p[':pmin'] = (float)$g['min'];
    }
    if (isset($g['max']) && $g['max'] !== '') {
        $w[] = 'l.price <= :pmax';
        $p[':pmax'] = (float)$g['max'];
    }
    return [implode(' AND ', $w), $p];
}

function listings_list(array $g): never
{
    [$where, $p] = listing_where($g);
    $sort = val($g, 'sort', 'newest');
    $order = match ($sort) {
        'price_asc'  => 'l.price ASC',
        'price_desc' => 'l.price DESC',
        default      => 'l.created_at DESC, l.id DESC',
    };
    $page = max(1, val_int($g, 'page', 1));
    $off  = ($page - 1) * PER_PAGE;

    $st = db()->prepare("SELECT COUNT(*) FROM listings l WHERE $where");
    $st->execute($p);
    $total = (int)$st->fetchColumn();

    $st = db()->prepare(
        "SELECT l.id, l.title, l.price, l.city, l.image, l.status, l.created_at,
                l.category_id, c.name_ar AS cat_ar, c.name_fr AS cat_fr, c.icon AS cat_icon
         FROM listings l LEFT JOIN categories c ON c.id = l.category_id
         WHERE $where ORDER BY $order LIMIT " . PER_PAGE . " OFFSET $off"
    );
    $st->execute($p);
    $items = $st->fetchAll();

    $me = current_user();
    if ($me && $items) {
        $ids = array_column($items, 'id');
        $ph  = implode(',', array_fill(0, count($ids), '?'));
        $st  = db()->prepare("SELECT listing_id FROM favorites WHERE user_id = ? AND listing_id IN ($ph)");
        $st->execute(array_merge([(int)$me['id']], $ids));
        $favs = array_map('intval', $st->fetchAll(PDO::FETCH_COLUMN));
        foreach ($items as &$it) {
            $it['is_fav'] = in_array((int)$it['id'], $favs, true);
        }
    } else {
        foreach ($items as &$it) {
            $it['is_fav'] = false;
        }
    }
    foreach ($items as &$it) {
        $it['id']    = (int)$it['id'];
        $it['price'] = (float)$it['price'];
    }

    api_json([
        'ok'   => true,
        'data' => [
            'items'  => $items,
            'total'  => $total,
            'page'   => $page,
            'pages'  => (int)ceil($total / PER_PAGE),
            'per_page' => PER_PAGE,
        ],
    ]);
}

function listing_row(int $id): array
{
    $st = db()->prepare(
        'SELECT l.*, u.name AS seller_name, u.city AS seller_city, u.created_at AS seller_since, u.phone AS seller_phone,
                c.name_ar AS cat_ar, c.name_fr AS cat_fr, c.icon AS cat_icon
         FROM listings l
         JOIN users u ON u.id = l.user_id
         LEFT JOIN categories c ON c.id = l.category_id
         WHERE l.id = ? LIMIT 1'
    );
    $st->execute([$id]);
    $l = $st->fetch();
    if (!$l) {
        err('not_found', 404);
    }
    return $l;
}

function listings_show(array $g): never
{
    $id = val_int($g, 'id');
    $l  = listing_row($id);
    $me = current_user();

    $is_mine = $me && (int)$me['id'] === (int)$l['user_id'];
    $is_fav  = false;
    if ($me && !$is_mine) {
        $st = db()->prepare('SELECT 1 FROM favorites WHERE user_id = ? AND listing_id = ?');
        $st->execute([(int)$me['id'], $id]);
        $is_fav = (bool)$st->fetch();
    }

    /* Annonces similaires (même catégorie, actives) */
    $st = db()->prepare(
        'SELECT l.id, l.title, l.price, l.city, l.image, l.status, l.created_at,
                c.name_ar AS cat_ar, c.name_fr AS cat_fr
         FROM listings l LEFT JOIN categories c ON c.id = l.category_id
         WHERE l.status = "active" AND l.id <> :id AND l.category_id = :cat
         ORDER BY l.created_at DESC LIMIT 4'
    );
    $st->execute([':id' => $id, ':cat' => $l['category_id'] ?? 0]);
    $similar = array_map(function ($r) {
        $r['id']    = (int)$r['id'];
        $r['price'] = (float)$r['price'];
        return $r;
    }, $st->fetchAll());

    $listing = [
        'id'          => (int)$l['id'],
        'title'       => (string)$l['title'],
        'description' => (string)$l['description'],
        'price'       => (float)$l['price'],
        'city'        => $l['city'],
        'image'       => $l['image'],
        'status'      => (string)$l['status'],
        'created_at'  => (string)$l['created_at'],
        'user_id'     => (int)$l['user_id'],
        'category_id' => $l['category_id'] !== null ? (int)$l['category_id'] : null,
        'cat_ar'      => $l['cat_ar'],
        'cat_fr'      => $l['cat_fr'],
        'cat_icon'    => $l['cat_icon'],
        'seller'      => [
            'id'    => (int)$l['user_id'],
            'name'  => (string)$l['seller_name'],
            'city'  => $l['seller_city'],
            'since' => (string)$l['seller_since'],
            'phone' => ($me !== null) ? $l['seller_phone'] : null, // téléphone visible seulement si connecté
        ],
    ];

    api_json(['ok' => true, 'data' => [
        'listing'  => $listing,
        'is_mine'  => (bool)$is_mine,
        'is_fav'   => $is_fav,
        'similar'  => $similar,
        'rate'     => COMMISSION_RATE,
    ]]);
}

function listings_mine(): never
{
    $me = require_login();
    $st = db()->prepare(
        'SELECT l.*, c.name_ar AS cat_ar, c.name_fr AS cat_fr
         FROM listings l LEFT JOIN categories c ON c.id = l.category_id
         WHERE l.user_id = ? ORDER BY l.created_at DESC, l.id DESC'
    );
    $st->execute([(int)$me['id']]);

    /* net vendeur pour les annonces vendues */
    $st2 = db()->prepare('SELECT listing_id, commission FROM sales WHERE seller_id = ?');
    $st2->execute([(int)$me['id']]);
    $coms = [];
    foreach ($st2->fetchAll() as $s) {
        $coms[(int)$s['listing_id']] = (float)$s['commission'];
    }

    $items = [];
    foreach ($st->fetchAll() as $l) {
        $price = (float)$l['price'];
        $items[] = [
            'id'      => (int)$l['id'],
            'title'   => (string)$l['title'],
            'price'   => $price,
            'city'    => $l['city'],
            'image'   => $l['image'],
            'status'  => (string)$l['status'],
            'created_at' => (string)$l['created_at'],
            'cat_ar'  => $l['cat_ar'],
            'cat_fr'  => $l['cat_fr'],
            'commission' => isset($coms[(int)$l['id']]) ? $coms[(int)$l['id']] : null,
            'net'     => isset($coms[(int)$l['id']]) ? round($price - $coms[(int)$l['id']], 2) : null,
        ];
    }
    api_json(['ok' => true, 'data' => $items]);
}

function listings_user(array $g): never
{
    $uid = val_int($g, 'user_id');
    $me  = current_user();
    $st  = db()->prepare('SELECT id, name, city, created_at FROM users WHERE id = ? LIMIT 1');
    $st->execute([$uid]);
    $u = $st->fetch();
    if (!$u) {
        err('not_found', 404);
    }
    $is_self = $me && (int)$me['id'] === $uid;

    if ($is_self) {
        $st = db()->prepare('SELECT id, title, price, city, image, status, created_at FROM listings WHERE user_id = ? ORDER BY created_at DESC, id DESC');
    } else {
        $st = db()->prepare('SELECT id, title, price, city, image, status, created_at FROM listings WHERE user_id = ? AND status = "active" ORDER BY created_at DESC, id DESC');
    }
    $st->execute([$uid]);
    $items = array_map(function ($r) {
        $r['id']    = (int)$r['id'];
        $r['price'] = (float)$r['price'];
        return $r;
    }, $st->fetchAll());

    api_json(['ok' => true, 'data' => [
        'user'      => ['id' => (int)$u['id'], 'name' => (string)$u['name'], 'city' => $u['city'], 'created_at' => (string)$u['created_at']],
        'is_self'   => (bool)$is_self,
        'items'     => $items,
        'count'     => count($items),
    ]]);
}

/** Validation commune création / édition */
function validate_listing(array $in): array
{
    $title = val($in, 'title');
    $desc  = val($in, 'description') ?: null;
    $price = (float)val($in, 'price', '0');
    $cat   = val_int($in, 'category_id');
    $city  = val($in, 'city') ?: null;

    if (mb_strlen($title) < 3) {
        err('err_title_len');
    }
    if ($price <= 0 || !is_finite($price)) {
        err('err_price');
    }
    if ($cat > 0) {
        $st = db()->prepare('SELECT id FROM categories WHERE id = ?');
        $st->execute([$cat]);
        if (!$st->fetch()) {
            err('err_fill');
        }
    } else {
        $cat = 0;
    }
    return [$title, $desc, $price, $cat, $city];
}

function listings_create(array $in): never
{
    $me = require_login();
    [$title, $desc, $price, $cat, $city] = validate_listing($in);
    $image = upload_image('image');

    $st = db()->prepare('INSERT INTO listings (user_id, category_id, title, description, price, city, image) VALUES (?,?,?,?,?,?,?)');
    $st->execute([(int)$me['id'], $cat ?: null, $title, $desc, $price, $city, $image]);
    api_json(['ok' => true, 'data' => ['id' => (int)db()->lastInsertId()]]);
}

function listings_update(array $in): never
{
    $me = require_login();
    $id = val_int($in, 'id');
    $l  = listing_row($id);
    if ((int)$l['user_id'] !== (int)$me['id']) {
        err('not_allowed', 403);
    }
    [$title, $desc, $price, $cat, $city] = validate_listing($in);
    $image = upload_image('image');
    $removeImage = val($in, 'remove_image') === '1';

    if ($image) {
        delete_upload($l['image']);
        $st = db()->prepare('UPDATE listings SET title=?, description=?, price=?, category_id=?, city=?, image=? WHERE id=?');
        $st->execute([$title, $desc, $price, $cat ?: null, $city, $image, $id]);
    } elseif ($removeImage) {
        delete_upload($l['image']);
        $st = db()->prepare('UPDATE listings SET title=?, description=?, price=?, category_id=?, city=?, image=NULL WHERE id=?');
        $st->execute([$title, $desc, $price, $cat ?: null, $city, $id]);
    } else {
        $st = db()->prepare('UPDATE listings SET title=?, description=?, price=?, category_id=?, city=? WHERE id=?');
        $st->execute([$title, $desc, $price, $cat ?: null, $city, $id]);
    }
    api_json(['ok' => true, 'data' => ['id' => $id]]);
}

function listings_delete(array $in): never
{
    $me = require_login();
    $id = val_int($in, 'id');
    $l  = listing_row($id);
    if ((int)$l['user_id'] !== (int)$me['id'] && (int)$me['is_admin'] !== 1) {
        err('not_allowed', 403);
    }
    delete_upload($l['image']);
    $st = db()->prepare('DELETE FROM listings WHERE id = ?');
    $st->execute([$id]);
    api_json(['ok' => true]);
}

/**
 * Marquer vendue / remettre en vente.
 * to = "sold"   → enregistre la vente + commission 10%
 * to = "active" → remet en vente, annule la commission
 */
function listings_sold(array $in): never
{
    $me = require_login();
    $id = val_int($in, 'id');
    $to = val($in, 'to', 'sold');
    $l  = listing_row($id);
    if ((int)$l['user_id'] !== (int)$me['id'] && (int)$me['is_admin'] !== 1) {
        err('not_allowed', 403);
    }
    if (!in_array($to, ['sold', 'active'], true)) {
        err('not_allowed', 403);
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        if ($to === 'sold') {
            if ($l['status'] !== 'sold') {
                $st = $pdo->prepare('SELECT id FROM sales WHERE listing_id = ? LIMIT 1');
                $st->execute([$id]);
                if (!$st->fetch()) {
                    $commission = round((float)$l['price'] * COMMISSION_RATE, 2);
                    $st = $pdo->prepare('INSERT INTO sales (listing_id, seller_id, final_price, commission) VALUES (?,?,?,?)');
                    $st->execute([$id, (int)$l['user_id'], (float)$l['price'], $commission]);
                }
                $st = $pdo->prepare('UPDATE listings SET status = "sold" WHERE id = ?');
                $st->execute([$id]);
            }
        } else {
            $st = $pdo->prepare('DELETE FROM sales WHERE listing_id = ?');
            $st->execute([$id]);
            $st = $pdo->prepare('UPDATE listings SET status = "active" WHERE id = ?');
            $st->execute([$id]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        err('server_error', 500);
    }

    $st = $pdo->prepare('SELECT commission, final_price FROM sales WHERE listing_id = ? LIMIT 1');
    $st->execute([$id]);
    $sale = $st->fetch();
    api_json(['ok' => true, 'data' => [
        'status'     => $to,
        'commission' => $sale ? (float)$sale['commission'] : null,
        'net'        => $sale ? round((float)$sale['final_price'] - (float)$sale['commission'], 2) : null,
    ]]);
}

/* ---------------- FAVORIS ---------------- */

function favorites_toggle(array $in): never
{
    $me = require_login();
    $id = val_int($in, 'listing_id');
    $st = db()->prepare('SELECT id FROM listings WHERE id = ?');
    $st->execute([$id]);
    if (!$st->fetch()) {
        err('not_found', 404);
    }
    $st = db()->prepare('SELECT 1 FROM favorites WHERE user_id = ? AND listing_id = ?');
    $st->execute([(int)$me['id'], $id]);
    $exists = (bool)$st->fetch();
    if ($exists) {
        $st = db()->prepare('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?');
        $st->execute([(int)$me['id'], $id]);
    } else {
        $st = db()->prepare('INSERT INTO favorites (user_id, listing_id) VALUES (?,?)');
        $st->execute([(int)$me['id'], $id]);
    }
    api_json(['ok' => true, 'data' => ['fav' => !$exists]]);
}

function favorites_list(): never
{
    $me = require_login();
    $st = db()->prepare(
        'SELECT l.id, l.title, l.price, l.city, l.image, l.status, l.created_at,
                c.name_ar AS cat_ar, c.name_fr AS cat_fr
         FROM favorites f
         JOIN listings l ON l.id = f.listing_id
         LEFT JOIN categories c ON c.id = l.category_id
         WHERE f.user_id = ? ORDER BY f.created_at DESC'
    );
    $st->execute([(int)$me['id']]);
    $items = array_map(function ($r) {
        $r['id']      = (int)$r['id'];
        $r['price']   = (float)$r['price'];
        $r['is_fav']  = true;
        return $r;
    }, $st->fetchAll());
    api_json(['ok' => true, 'data' => $items]);
}

/* ---------------- CONVERSATIONS + MESSAGES ---------------- */

function conv_participant(int $convId, int $uid): ?array
{
    $st = db()->prepare('SELECT * FROM conversations WHERE id = ? LIMIT 1');
    $st->execute([$convId]);
    $c = $st->fetch();
    if (!$c) {
        return null;
    }
    if ((int)$c['buyer_id'] !== $uid && (int)$c['seller_id'] !== $uid) {
        return null;
    }
    return $c;
}

function conversations_list(): never
{
    $me = require_login();
    $uid = (int)$me['id'];
    $st = db()->prepare(
        'SELECT c.id, c.listing_id, c.buyer_id, c.seller_id, c.created_at,
                l.title, l.price, l.image, l.status AS listing_status,
                bu.name AS buyer_name, se.name AS seller_name,
                (SELECT m.body   FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_body,
                (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_time,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id IS NOT NULL AND m.sender_id <> :uid AND m.is_read = 0) AS unread
         FROM conversations c
         JOIN listings l ON l.id = c.listing_id
         JOIN users bu ON bu.id = c.buyer_id
         JOIN users se ON se.id = c.seller_id
         WHERE c.buyer_id = :uid2 OR c.seller_id = :uid3
         ORDER BY last_time DESC, c.id DESC
         LIMIT 200'
    );
    $st->execute([':uid' => $uid, ':uid2' => $uid, ':uid3' => $uid]);
    $rows = $st->fetchAll();
    $out = [];
    foreach ($rows as $c) {
        $other = (int)$c['buyer_id'] === $uid ? $c['seller_name'] : $c['buyer_name'];
        $out[] = [
            'id'             => (int)$c['id'],
            'listing_id'     => (int)$c['listing_id'],
            'listing_title'  => (string)$c['title'],
            'listing_price'  => (float)$c['price'],
            'listing_image'  => $c['image'],
            'listing_status' => (string)$c['listing_status'],
            'other_name'     => (string)$other,
            'last_body'      => $c['last_body'],
            'last_time'      => $c['last_time'],
            'unread'         => (int)$c['unread'],
        ];
    }
    api_json(['ok' => true, 'data' => $out]);
}

function conversations_start(array $in): never
{
    $me  = require_login();
    $lid = val_int($in, 'listing_id');
    $st  = db()->prepare('SELECT * FROM listings WHERE id = ? LIMIT 1');
    $st->execute([$lid]);
    $l = $st->fetch();
    if (!$l || $l['status'] !== 'active' || (int)$l['user_id'] === (int)$me['id']) {
        err('start_conv_error', 403);
    }
    $st = db()->prepare('SELECT id FROM conversations WHERE listing_id = ? AND buyer_id = ? LIMIT 1');
    $st->execute([$lid, (int)$me['id']]);
    $existing = $st->fetchColumn();
    if ($existing) {
        api_json(['ok' => true, 'data' => ['conversation_id' => (int)$existing]]);
    }
    $st = db()->prepare('INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES (?,?,?)');
    $st->execute([$lid, (int)$me['id'], (int)$l['user_id']]);
    api_json(['ok' => true, 'data' => ['conversation_id' => (int)db()->lastInsertId()]]);
}

function messages_get(array $g): never
{
    $me  = require_login();
    $cid = val_int($g, 'conversation_id');
    $c   = conv_participant($cid, (int)$me['id']);
    if (!$c) {
        err('not_allowed', 403);
    }
    $after = max(0, val_int($g, 'after', 0));

    $st = db()->prepare('SELECT id, sender_id, body, created_at FROM messages WHERE conversation_id = ? AND id > ? ORDER BY id ASC LIMIT 200');
    $st->execute([$cid, $after]);
    $msgs = array_map(function ($m) use ($me) {
        return [
            'id'         => (int)$m['id'],
            'mine'       => (int)$m['sender_id'] === (int)$me['id'],
            'sender_id'  => $m['sender_id'] !== null ? (int)$m['sender_id'] : null,
            'body'       => (string)$m['body'],
            'created_at' => (string)$m['created_at'],
        ];
    }, $st->fetchAll());

    $payload = [];
    if ($after === 0) {
        $st = db()->prepare(
            'SELECT l.id, l.title, l.price, l.image, l.status, bu.name AS buyer_name, se.name AS seller_name
             FROM conversations c
             JOIN listings l ON l.id = c.listing_id
             JOIN users bu ON bu.id = c.buyer_id
             JOIN users se ON se.id = c.seller_id
             WHERE c.id = ?'
        );
        $st->execute([$cid]);
        $info = $st->fetch();
        $payload = [
            'listing' => [
                'id'     => (int)$info['id'],
                'title'  => (string)$info['title'],
                'price'  => (float)$info['price'],
                'image'  => $info['image'],
                'status' => (string)$info['status'],
            ],
            'buyer'   => ['id' => (int)$c['buyer_id'], 'name' => (string)$info['buyer_name']],
            'seller'  => ['id' => (int)$c['seller_id'], 'name' => (string)$info['seller_name']],
        ];
        /* marquer comme lus les messages de l'autre */
        $st = db()->prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id <> ? AND is_read = 0');
        $st->execute([$cid, (int)$me['id']]);
    }
    $payload['messages'] = $msgs;
    api_json(['ok' => true, 'data' => $payload]);
}

function messages_send(array $in): never
{
    $me   = require_login();
    $cid  = val_int($in, 'conversation_id');
    $body = val($in, 'body');
    if ($body === '') {
        err('empty_msg');
    }
    if (mb_strlen($body) > 2000) {
        err('msg_too_long');
    }
    if (!conv_participant($cid, (int)$me['id'])) {
        err('not_allowed', 403);
    }
    $st = db()->prepare('INSERT INTO messages (conversation_id, sender_id, body) VALUES (?,?,?)');
    $st->execute([$cid, (int)$me['id'], $body]);
    api_json(['ok' => true, 'data' => [
        'id'         => (int)db()->lastInsertId(),
        'mine'       => true,
        'sender_id'  => (int)$me['id'],
        'body'       => $body,
        'created_at' => date('Y-m-d H:i:s'),
    ]]);
}

/* ---------------- ADMIN ---------------- */

function admin_stats(): never
{
    require_admin();
    $q = db();
    $stats = [
        'users'       => (int)$q->query('SELECT COUNT(*) FROM users')->fetchColumn(),
        'listings'    => (int)$q->query('SELECT COUNT(*) FROM listings')->fetchColumn(),
        'active'      => (int)$q->query('SELECT COUNT(*) FROM listings WHERE status = "active"')->fetchColumn(),
        'sales'       => (int)$q->query('SELECT COUNT(*) FROM sales')->fetchColumn(),
        'commission'  => (float)$q->query('SELECT COALESCE(SUM(commission),0) FROM sales')->fetchColumn(),
        'convos'      => (int)$q->query('SELECT COUNT(*) FROM conversations')->fetchColumn(),
        'messages'    => (int)$q->query('SELECT COUNT(*) FROM messages')->fetchColumn(),
    ];
    $stats['commission_month'] = (float)$q->query(
        'SELECT COALESCE(SUM(commission),0) FROM sales WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())'
    )->fetchColumn();

    $latest_sales = $q->query(
        'SELECT s.id, s.listing_id, s.final_price, s.commission, s.created_at, l.title, u.name AS seller
         FROM sales s JOIN listings l ON l.id = s.listing_id JOIN users u ON u.id = s.seller_id
         ORDER BY s.created_at DESC, s.id DESC LIMIT 6'
    )->fetchAll();

    $latest_users = $q->query(
        'SELECT id, name, email, city, is_admin, created_at FROM users ORDER BY created_at DESC, id DESC LIMIT 6'
    )->fetchAll();

    $latest_listings = $q->query(
        'SELECT l.id, l.title, l.price, l.image, l.status, u.name AS seller
         FROM listings l JOIN users u ON u.id = l.user_id
         ORDER BY l.created_at DESC, l.id DESC LIMIT 6'
    )->fetchAll();

    api_json(['ok' => true, 'data' => [
        'stats'           => $stats,
        'latest_sales'    => $latest_sales,
        'latest_users'    => array_map(fn($u) => ['id' => (int)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'city' => $u['city'], 'is_admin' => (int)$u['is_admin'] === 1, 'created_at' => $u['created_at']], $latest_users),
        'latest_listings' => array_map(fn($l) => ['id' => (int)$l['id'], 'title' => $l['title'], 'price' => (float)$l['price'], 'image' => $l['image'], 'status' => $l['status'], 'seller' => $l['seller']], $latest_listings),
    ]]);
}

function admin_listings(array $g): never
{
    require_admin();
    $w = ['1=1'];
    $p = [];
    $qs = val($g, 'q');
    if ($qs !== '') {
        $w[] = '(l.title LIKE :q1 OR u.name LIKE :q2)';
        $p[':q1'] = '%' . $qs . '%';
        $p[':q2'] = '%' . $qs . '%';
    }
    $status = val($g, 'status');
    if (in_array($status, ['active', 'sold'], true)) {
        $w[] = 'l.status = :st';
        $p[':st'] = $status;
    }
    $where = implode(' AND ', $w);
    $st = db()->prepare(
        "SELECT l.id, l.title, l.price, l.image, l.status, l.created_at, l.category_id,
                u.name AS seller, c.name_ar AS cat_ar, c.name_fr AS cat_fr
         FROM listings l JOIN users u ON u.id = l.user_id LEFT JOIN categories c ON c.id = l.category_id
         WHERE $where ORDER BY l.created_at DESC, l.id DESC LIMIT 200"
    );
    $st->execute($p);
    $items = array_map(fn($l) => [
        'id'      => (int)$l['id'],
        'title'   => $l['title'],
        'price'   => (float)$l['price'],
        'image'   => $l['image'],
        'status'  => $l['status'],
        'created_at' => $l['created_at'],
        'seller'  => $l['seller'],
        'cat_ar'  => $l['cat_ar'],
        'cat_fr'  => $l['cat_fr'],
    ], $st->fetchAll());
    api_json(['ok' => true, 'data' => $items]);
}

function admin_listing_action(array $in): never
{
    require_admin();
    $id     = val_int($in, 'id');
    $action = val($in, 'action');
    $st = db()->prepare('SELECT * FROM listings WHERE id = ? LIMIT 1');
    $st->execute([$id]);
    $l = $st->fetch();
    if (!$l) {
        err('not_found', 404);
    }
    if ($action === 'sold') {
        if ($l['status'] !== 'sold') {
            $st = db()->prepare('SELECT id FROM sales WHERE listing_id = ? LIMIT 1');
            $st->execute([$id]);
            if (!$st->fetch()) {
                $commission = round((float)$l['price'] * COMMISSION_RATE, 2);
                $st = db()->prepare('INSERT INTO sales (listing_id, seller_id, final_price, commission) VALUES (?,?,?,?)');
                $st->execute([$id, (int)$l['user_id'], (float)$l['price'], $commission]);
            }
            $st = db()->prepare('UPDATE listings SET status = "sold" WHERE id = ?');
            $st->execute([$id]);
        }
        api_json(['ok' => true, 'data' => ['status' => 'sold']]);
    }
    if ($action === 'reopen') {
        $st = db()->prepare('DELETE FROM sales WHERE listing_id = ?');
        $st->execute([$id]);
        $st = db()->prepare('UPDATE listings SET status = "active" WHERE id = ?');
        $st->execute([$id]);
        api_json(['ok' => true, 'data' => ['status' => 'active']]);
    }
    if ($action === 'delete') {
        delete_upload($l['image']);
        $st = db()->prepare('DELETE FROM listings WHERE id = ?');
        $st->execute([$id]);
        api_json(['ok' => true, 'data' => ['deleted' => true]]);
    }
    err('not_allowed', 403);
}

function admin_users(array $g): never
{
    require_admin();
    $w = ['1=1'];
    $p = [];
    $qs = val($g, 'q');
    if ($qs !== '') {
        $w[] = '(u.name LIKE :q1 OR u.email LIKE :q2)';
        $p[':q1'] = '%' . $qs . '%';
        $p[':q2'] = '%' . $qs . '%';
    }
    $where = implode(' AND ', $w);
    $st = db()->prepare(
        "SELECT u.id, u.name, u.email, u.city, u.is_admin, u.created_at, COUNT(l.id) AS cnt
         FROM users u LEFT JOIN listings l ON l.user_id = u.id
         WHERE $where GROUP BY u.id ORDER BY u.created_at DESC, u.id DESC LIMIT 200"
    );
    $st->execute($p);
    $items = array_map(fn($u) => [
        'id'      => (int)$u['id'],
        'name'    => $u['name'],
        'email'   => $u['email'],
        'city'    => $u['city'],
        'is_admin' => (int)$u['is_admin'] === 1,
        'created_at' => $u['created_at'],
        'cnt'     => (int)$u['cnt'],
    ], $st->fetchAll());
    api_json(['ok' => true, 'data' => $items]);
}

function admin_user_action(array $in): never
{
    $me = require_admin();
    $id = val_int($in, 'id');
    $action = val($in, 'action');
    $st = db()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $st->execute([$id]);
    $u = $st->fetch();
    if (!$u) {
        err('not_found', 404);
    }
    if ((int)$u['is_admin'] === 1) {
        err('err_cannot_admin', 403);
    }
    if ($action === 'toggle_admin') {
        $st = db()->prepare('UPDATE users SET is_admin = 1 WHERE id = ?');
        $st->execute([$id]);
        api_json(['ok' => true, 'data' => ['is_admin' => true]]);
    }
    if ($action === 'remove_admin') {
        $st = db()->prepare('UPDATE users SET is_admin = 0 WHERE id = ?');
        $st->execute([$id]);
        api_json(['ok' => true, 'data' => ['is_admin' => false]]);
    }
    if ($action === 'delete') {
        $st = db()->prepare('DELETE FROM users WHERE id = ?');
        $st->execute([$id]);
        api_json(['ok' => true, 'data' => ['deleted' => true]]);
    }
    err('not_allowed', 403);
}

function admin_commissions(): never
{
    require_admin();
    $q = db();
    $total = (float)$q->query('SELECT COALESCE(SUM(commission),0) FROM sales')->fetchColumn();
    $month = (float)$q->query('SELECT COALESCE(SUM(commission),0) FROM sales WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())')->fetchColumn();
    $count = (int)$q->query('SELECT COUNT(*) FROM sales')->fetchColumn();
    $avg   = $count > 0 ? (float)$q->query('SELECT AVG(final_price) FROM sales')->fetchColumn() : 0.0;

    $sales = array_map(fn($s) => [
        'id'          => (int)$s['id'],
        'title'       => $s['title'],
        'seller'      => $s['seller'],
        'final_price' => (float)$s['final_price'],
        'commission'  => (float)$s['commission'],
        'created_at'  => $s['created_at'],
    ], $q->query(
        'SELECT s.id, s.final_price, s.commission, s.created_at, l.title, u.name AS seller
         FROM sales s JOIN listings l ON l.id = s.listing_id JOIN users u ON u.id = s.seller_id
         ORDER BY s.created_at DESC, s.id DESC LIMIT 200'
    )->fetchAll());

    api_json(['ok' => true, 'data' => [
        'total' => $total, 'month' => $month, 'count' => $count, 'avg' => round($avg, 2), 'sales' => $sales,
    ]]);
}

function admin_conversations(): never
{
    require_admin();
    $rows = db()->query(
        'SELECT c.id, l.title, l.price, l.image,
                bu.name AS buyer, se.name AS seller,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS msg_count,
                (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id) AS last_time
         FROM conversations c
         JOIN listings l ON l.id = c.listing_id
         JOIN users bu ON bu.id = c.buyer_id
         JOIN users se ON se.id = c.seller_id
         ORDER BY last_time DESC, c.id DESC LIMIT 200'
    )->fetchAll();
    $items = array_map(fn($c) => [
        'id'      => (int)$c['id'],
        'title'   => $c['title'],
        'price'   => (float)$c['price'],
        'image'   => $c['image'],
        'buyer'   => $c['buyer'],
        'seller'  => $c['seller'],
        'msg_count' => (int)$c['msg_count'],
        'last_time' => $c['last_time'],
    ], $rows);
    api_json(['ok' => true, 'data' => $items]);
}

function admin_messages(array $g): never
{
    $me = require_admin();
    $cid = val_int($g, 'conversation_id');
    $st = db()->prepare(
        'SELECT c.*, l.title, l.price, l.image,
                bu.name AS buyer_name, se.name AS seller_name
         FROM conversations c
         JOIN listings l ON l.id = c.listing_id
         JOIN users bu ON bu.id = c.buyer_id
         JOIN users se ON se.id = c.seller_id
         WHERE c.id = ? LIMIT 1'
    );
    $st->execute([$cid]);
    $c = $st->fetch();
    if (!$c) {
        err('not_found', 404);
    }
    $st = db()->prepare(
        'SELECT m.id, m.sender_id, m.body, m.created_at, u.name AS sender_name
         FROM messages m LEFT JOIN users u ON u.id = m.sender_id
         WHERE m.conversation_id = ? ORDER BY m.id ASC LIMIT 500'
    );
    $st->execute([$cid]);
    $msgs = array_map(fn($m) => [
        'id'         => (int)$m['id'],
        'body'       => (string)$m['body'],
        'created_at' => (string)$m['created_at'],
        'sender_id'  => $m['sender_id'] !== null ? (int)$m['sender_id'] : null,
        'sender_name' => $m['sender_name'] ?: null,
        'mine'       => $m['sender_id'] !== null && (int)$m['sender_id'] === (int)$me['id'],
    ], $st->fetchAll());

    api_json(['ok' => true, 'data' => [
        'listing' => ['id' => (int)$c['listing_id'], 'title' => $c['title'], 'price' => (float)$c['price'], 'image' => $c['image']],
        'buyer'   => ['id' => (int)$c['buyer_id'], 'name' => $c['buyer_name']],
        'seller'  => ['id' => (int)$c['seller_id'], 'name' => $c['seller_name']],
        'is_participant' => ((int)$c['buyer_id'] === (int)$me['id'] || (int)$c['seller_id'] === (int)$me['id']),
        'messages' => $msgs,
    ]]);
}

/* ============================================================
   Routeur
   ============================================================ */

try {
    if ($method === 'POST') {
        csrf_check();
    }
    if ($method === 'GET') {
        switch ($route) {
            case 'auth/me':            me_payload();
            case 'categories':         categories_list();
            case 'listings':           listings_list($_GET);
            case 'listings/show':      listings_show($_GET);
            case 'listings/mine':      listings_mine();
            case 'listings/user':      listings_user($_GET);
            case 'favorites':          favorites_list();
            case 'conversations':      conversations_list();
            case 'messages':           messages_get($_GET);
            case 'admin/stats':        admin_stats();
            case 'admin/listings':     admin_listings($_GET);
            case 'admin/users':        admin_users($_GET);
            case 'admin/commissions':  admin_commissions();
            case 'admin/conversations': admin_conversations();
            case 'admin/messages':     admin_messages($_GET);
        }
    } elseif ($method === 'POST') {
        switch ($route) {
            case 'auth/register':          auth_register($in);
            case 'auth/login':             auth_login($in);
            case 'auth/logout':            auth_logout();
            case 'auth/password':          auth_password($in);
            case 'listings':               listings_create($in);
            case 'listings/update':        listings_update($in);
            case 'listings/delete':        listings_delete($in);
            case 'listings/sold':          listings_sold($in);
            case 'favorites/toggle':       favorites_toggle($in);
            case 'conversations/start':    conversations_start($in);
            case 'messages/send':          messages_send($in);
            case 'admin/listing-action':   admin_listing_action($in);
            case 'admin/user-action':      admin_user_action($in);
        }
    }
    api_json(['ok' => false, 'error' => 'not_found'], 404);
} catch (ApiError $e) {
    api_json(['ok' => false, 'error' => $e->getMessage()], $e->status);
} catch (Throwable $e) {
    api_json(['ok' => false, 'error' => 'server_error'], 500);
}
