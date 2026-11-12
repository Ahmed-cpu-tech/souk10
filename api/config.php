<?php
declare(strict_types=1);

/**
 * Souk10 — API config + helpers
 * ------------------------------------------------------------------
 * L'application est 100% HTML/CSS/JS. Ce dossier "api/" contient
 * uniquement le petit serveur d'API (PHP) qui relie le JavaScript
 * à la base de données MySQL, car un navigateur ne peut pas se
 * connecter à MySQL directement.
 *
 * Identifiants XAMPP par défaut (root, sans mot de passe, port 3306).
 * Surcharge possible via variables d'environnement :
 *   SOUK10_DB_HOST, SOUK10_DB_PORT, SOUK10_DB_NAME, SOUK10_DB_USER, SOUK10_DB_PASS
 */

define('DB_HOST', getenv('SOUK10_DB_HOST') ?: '127.0.0.1');
define('DB_PORT', (int)(getenv('SOUK10_DB_PORT') ?: 3306));
define('DB_NAME', getenv('SOUK10_DB_NAME') ?: 'souk10');
define('DB_USER', getenv('SOUK10_DB_USER') ?: 'root');
define('DB_PASS', getenv('SOUK10_DB_PASS') !== false ? (string)getenv('SOUK10_DB_PASS') : '');

define('COMMISSION_RATE', 0.10);              // 10% pour la plateforme
define('UPLOAD_DIR', dirname(__DIR__) . '/uploads');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024);   // 5 Mo
define('PER_PAGE', 12);                       // annonces par page

/* ---------- Session ---------- */
if (session_status() === PHP_SESSION_NONE) {
    session_name('souk10_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

/* ---------- Connexion PDO ---------- */
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            api_json(['ok' => false, 'error' => 'db_error'], 500);
        }
    }
    return $pdo;
}

/* ---------- Réponses JSON ---------- */
function api_json(array $data, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Exception d'API : message = clé de traduction côté JS */
final class ApiError extends RuntimeException
{
    public int $status;
    public function __construct(string $key, int $status = 400)
    {
        parent::__construct($key);
        $this->status = $status;
    }
}

function err(string $key, int $status = 400): never
{
    throw new ApiError($key, $status);
}

/* ---------- Utilisateur courant ---------- */
function current_user(): ?array
{
    static $user = null, $loaded = false;
    if (!$loaded) {
        $loaded = true;
        if (!empty($_SESSION['user_id'])) {
            $st = db()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
            $st->execute([(int)$_SESSION['user_id']]);
            $u = $st->fetch();
            if ($u) {
                $user = $u;
            } else {
                unset($_SESSION['user_id']);
            }
        }
    }
    return $user;
}

function is_admin(): bool
{
    $u = current_user();
    return $u !== null && (int)$u['is_admin'] === 1;
}

function require_login(): array
{
    $u = current_user();
    if ($u === null) {
        err('login_required', 401);
    }
    return $u;
}

function require_admin(): array
{
    $u = require_login();
    if ((int)$u['is_admin'] !== 1) {
        err('admin_required', 403);
    }
    return $u;
}

/** Utilisateur "public" (sans le hash du mot de passe) */
function safe_user(array $u): array
{
    return [
        'id'         => (int)$u['id'],
        'name'       => (string)$u['name'],
        'email'      => (string)$u['email'],
        'phone'      => $u['phone'] !== null ? (string)$u['phone'] : null,
        'city'       => $u['city'] !== null ? (string)$u['city'] : null,
        'is_admin'   => (int)$u['is_admin'] === 1,
        'created_at' => (string)$u['created_at'],
    ];
}

/* ---------- CSRF ---------- */
function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(20));
    }
    return $_SESSION['csrf'];
}

function csrf_check(): void
{
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf'] ?? '');
    if (!is_string($sent) || $sent === '' || !hash_equals(csrf_token(), $sent)) {
        err('csrf_invalid', 419);
    }
}

/* ---------- Compteur de messages non lus ---------- */
function unread_total(int $uid): int
{
    $st = db()->prepare(
        'SELECT COUNT(*) FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
         WHERE (c.buyer_id = :u1 OR c.seller_id = :u2)
           AND m.sender_id IS NOT NULL AND m.sender_id <> :u3
           AND m.is_read = 0'
    );
    $st->execute([':u1' => $uid, ':u2' => $uid, ':u3' => $uid]);
    return (int)$st->fetchColumn();
}

/* ---------- Upload d'images ---------- */
/** Valide et enregistre l'image du champ $field. Retourne le nom de fichier ou null. */
function upload_image(string $field): ?string
{
    if (!isset($_FILES[$field]) || !is_array($_FILES[$field])) {
        return null;
    }
    $f = $_FILES[$field];
    if (($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ($f['error'] !== UPLOAD_ERR_OK) {
        err('err_upload_error');
    }
    if ((int)$f['size'] <= 0 || (int)$f['size'] > MAX_UPLOAD_SIZE) {
        err('err_image_too_big');
    }
    $info = @getimagesize((string)$f['tmp_name']);
    if (!$info) {
        err('err_image_invalid');
    }
    $map = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_GIF => 'gif', IMAGETYPE_WEBP => 'webp'];
    $ext  = $map[$info[2]] ?? null;
    if ($ext === null) {
        err('err_image_type');
    }
    if (!is_dir(UPLOAD_DIR)) {
        @mkdir(UPLOAD_DIR, 0775, true);
    }
    $name = 'lst_' . date('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    if (!@move_uploaded_file((string)$f['tmp_name'], UPLOAD_DIR . '/' . $name)) {
        err('err_upload_failed');
    }
    return $name;
}

function delete_upload(?string $name): void
{
    if (!$name) {
        return;
    }
    $base = basename((string)$name);
    $path = UPLOAD_DIR . '/' . $base;
    if (is_file($path) && preg_match('/^lst_[a-z0-9_]+\.(jpg|png|gif|webp)$/i', $base)) {
        @unlink($path);
    }
}
